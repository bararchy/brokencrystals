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

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Validate and sanitize the file path
    if (file.includes('..')) {
      throw new BadRequestException('Invalid file path');
    }

    if (file.startsWith('/')) {
      const safePath = path.join(process.cwd(), 'safe_directory', file);
      await fs.promises.access(safePath, R_OK);

      return fs.createReadStream(safePath);
    } else if (file.startsWith('http')) {
      // Validate URL
      let url;
      try {
        url = new URL(file);
      } catch (error) {
        throw new BadRequestException('Invalid URL');
      }

      // Check against allowed hosts
      const allowedHosts = [
        'example.com', // Add your allowed hosts here
        'another-example.com'
      ];

      if (!allowedHosts.includes(url.hostname)) {
        throw new BadRequestException('Host not allowed');
      }

      // Ensure the path is not accessing metadata endpoints
      const forbiddenPaths = [
        '/metadata/',
        '/latest/meta-data/',
        '/computeMetadata/v1/',
      ];

      if (forbiddenPaths.some(path => url.pathname.includes(path))) {
        throw new BadRequestException('Access to metadata endpoints is forbidden');
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      const safePath = path.join(process.cwd(), 'safe_directory', file);
      await fs.promises.access(safePath, R_OK);

      return fs.createReadStream(safePath);
    }
  }

  async deleteFile(file: string): Promise<boolean> {
    try {
      if (file.startsWith('/')) {
        throw new Error('cannot delete file from this location');
      } else if (file.startsWith('http')) {
        throw new Error('cannot delete file from this location');
      } else {
        const safePath = path.join(process.cwd(), 'safe_directory', file);
        await fs.promises.unlink(safePath);
        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new InternalServerErrorException('An error occurred while deleting the file.');
    }
  }
}