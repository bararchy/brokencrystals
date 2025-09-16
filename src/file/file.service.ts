import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
    const baseDir = path.resolve(process.cwd(), 'allowed_files');
    const resolvedPath = path.resolve(baseDir, filePath);
    return resolvedPath.startsWith(baseDir);
  }

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    if (file.startsWith('/')) {
      if (!this.isValidPath(file)) {
        throw new BadRequestException('Invalid file path');
      }
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      // Validate URL
      let url;
      try {
        url = new URL(file);
      } catch (err) {
        throw new BadRequestException('Invalid URL');
      }

      // Check against allowed hosts
      const allowedHosts = [
        'metadata.google.internal',
        '169.254.169.254'
      ];

      if (!allowedHosts.includes(url.hostname)) {
        throw new BadRequestException('Host not allowed');
      }

      // Check for path traversal
      if (url.pathname.includes('..')) {
        throw new BadRequestException('Path traversal detected');
      }

      // Check for allowed paths
      const allowedPaths = this.cloudProviders.getAllowedPaths(url.hostname);
      if (!allowedPaths.some(allowedPath => url.pathname.startsWith(allowedPath))) {
        throw new BadRequestException('Path not allowed');
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      if (!this.isValidPath(file)) {
        throw new BadRequestException('Invalid file path');
      }
      file = path.resolve(process.cwd(), file);

      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    }
  }

  async deleteFile(file: string): Promise<boolean> {
    try {
      if (file.startsWith('/')) {
        throw new Error('cannot delete file from this location');
      } else if (file.startsWith('http')) {
        throw new Error('cannot delete file from this location');
      } else {
        file = path.resolve(process.cwd(), file);
        await fs.promises.unlink(file);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}