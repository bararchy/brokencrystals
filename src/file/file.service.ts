import { Injectable, Logger } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';
import { URL } from 'url';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Validate the file path to prevent directory traversal
    if (!this.isValidPath(file)) {
      throw new Error('Invalid file path.');
    }

    if (file.startsWith('/')) {
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      // Validate URL against allowed cloud provider base URLs
      const url = new URL(file);
      if (!this.isAllowedCloudProvider(url)) {
        throw new Error('Access to the specified URL is not allowed.');
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      file = path.resolve(process.cwd(), file);

      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    }
  }

  private isAllowedCloudProvider(url: URL): boolean {
    const allowedHosts = [
      'metadata.google.internal',
      's3.amazonaws.com',
      'storage.googleapis.com',
      'blob.core.windows.net',
      'digitaloceanspaces.com'
    ];
    return allowedHosts.includes(url.hostname);
  }

  private isValidPath(filePath: string): boolean {
    // Prevent directory traversal by checking for '..' in the path
    const resolvedPath = path.resolve(filePath);
    return !resolvedPath.includes('..') && resolvedPath.startsWith(process.cwd());
  }

  async deleteFile(file: string): Promise<boolean> {
    if (file.startsWith('/')) {
      throw new Error('cannot delete file from this location');
    } else if (file.startsWith('http')) {
      throw new Error('cannot delete file from this location');
    } else {
      file = path.resolve(process.cwd(), file);
      await fs.promises.unlink(file);
      return true;
    }
  }
}
