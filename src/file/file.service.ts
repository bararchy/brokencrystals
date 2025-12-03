import { Injectable, Logger } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';
import * as url from 'url';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  private isValidPath(filePath: string): boolean {
    // Define a base directory for file access
    const baseDir = path.resolve(process.cwd(), 'allowed_files');
    const resolvedPath = path.resolve(baseDir, filePath);

    // Ensure the resolved path is within the base directory
    return resolvedPath.startsWith(baseDir);
  }

  private isValidUrl(requestUrl: string): boolean {
    try {
      const parsedUrl = new url.URL(requestUrl);
      // Allow only specific protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }
      // Implement further checks like hostname whitelisting if needed
      const allowedHostnames = ['example.com', 'another-allowed-domain.com'];
      if (!allowedHostnames.includes(parsedUrl.hostname)) {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    if (!this.isValidPath(file)) {
      throw new Error('Access to this file path is not allowed');
    }

    const resolvedPath = path.resolve(process.cwd(), 'allowed_files', file);
    await fs.promises.access(resolvedPath, R_OK);

    return fs.createReadStream(resolvedPath);
  }

  async deleteFile(file: string): Promise<boolean> {
    if (!this.isValidPath(file)) {
      throw new Error('Access to this file path is not allowed');
    }

    const resolvedPath = path.resolve(process.cwd(), 'allowed_files', file);
    await fs.promises.unlink(resolvedPath);
    return true;
  }
}