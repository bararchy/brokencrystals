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
      throw new Error('Invalid file path');
    }

    try {
      if (file.startsWith('/')) {
        await fs.promises.access(file, R_OK);

        return fs.createReadStream(file);
      } else if (file.startsWith('http')) {
        const url = new URL(file);
        if (!this.isAllowedHost(url.hostname)) {
          throw new Error(`Access to the host '${url.hostname}' is not allowed`);
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
    } catch (err) {
      this.logger.error(`Error accessing file: ${err.message}`);
      throw new Error('File not found or inaccessible');
    }
  }

  private isAllowedHost(hostname: string): boolean {
    const allowedHosts = [
      // Removed 'metadata.google.internal' and '169.254.169.254' to prevent SSRF
    ];
    return allowedHosts.includes(hostname);
  }

  private isValidPath(filePath: string): boolean {
    // Prevent directory traversal by ensuring the resolved path is within a specific directory
    const basePath = path.resolve(process.cwd(), 'allowed_directory'); // Change 'allowed_directory' to the base directory
    const resolvedPath = path.resolve(basePath, filePath);
    return resolvedPath.startsWith(basePath);
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
