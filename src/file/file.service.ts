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

  private readonly allowedBasePath = path.resolve(process.cwd(), 'allowed/files');

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    const resolvedPath = path.resolve(this.allowedBasePath, file);
    if (!resolvedPath.startsWith(this.allowedBasePath)) {
      throw new Error('Access to this file path is not allowed');
    }

    try {
      await fs.promises.access(resolvedPath, R_OK);
      return fs.createReadStream(resolvedPath);
    } catch (err) {
      this.logger.error(`File not found or inaccessible: ${resolvedPath}`);
      throw new Error('File not found or inaccessible');
    }
  }

  async deleteFile(file: string): Promise<boolean> {
    const resolvedPath = path.resolve(this.allowedBasePath, file);
    if (!resolvedPath.startsWith(this.allowedBasePath)) {
      throw new Error('Cannot delete file from this location');
    }

    await fs.promises.unlink(resolvedPath);
    return true;
  }

  private isAllowedHost(hostname: string): boolean {
    const allowedHosts = [
      'example.com', // Add more allowed hosts as needed
      'metadata.google.internal',
    ];
    return allowedHosts.includes(hostname);
  }
}
