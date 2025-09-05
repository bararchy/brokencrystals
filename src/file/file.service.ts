import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
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

  private isValidPath(filePath: string): boolean {
    // Define a base directory for file access
    const baseDir = path.resolve(process.cwd(), 'files');
    const resolvedPath = path.resolve(baseDir, filePath);
    return resolvedPath.startsWith(baseDir);
  }

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    try {
      if (file.startsWith('/')) {
        if (!this.isValidPath(file)) {
          throw new Error('Access to this path is not allowed');
        }
        await fs.promises.access(file, R_OK);

        return fs.createReadStream(file);
      } else if (file.startsWith('http')) {
        // Validate URL
        let url;
        try {
          url = new URL(file);
        } catch (err) {
          throw new Error(`Invalid URL: ${file}`);
        }

        // Check against allowed hosts
        const allowedHosts = [
          'example.com', // Add your allowed hosts here
          'another-example.com'
        ];

        if (!allowedHosts.includes(url.hostname)) {
          throw new Error(`Host not allowed: ${url.hostname}`);
        }

        // Ensure the URL path is safe
        if (url.pathname.includes('..')) {
          throw new Error('Invalid path in URL');
        }

        // Ensure the URL uses a safe protocol
        if (url.protocol !== 'https:') {
          throw new Error('Only HTTPS protocol is allowed');
        }

        const content = await this.cloudProviders.get(file);

        if (content) {
          return Readable.from(content);
        } else {
          throw new Error(`no such file or directory, access '${file}'`);
        }
      } else {
        if (!this.isValidPath(file)) {
          throw new Error('Access to this path is not allowed');
        }
        file = path.resolve(process.cwd(), file);

        await fs.promises.access(file, R_OK);

        return fs.createReadStream(file);
      }
    } catch (err) {
      this.logger.error(err.message);
      throw new InternalServerErrorException('An error occurred while accessing the file.');
    }
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