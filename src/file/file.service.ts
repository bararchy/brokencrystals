import { Injectable, Logger } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Validate the file path to prevent directory traversal
    if (file.includes('..') || path.isAbsolute(file)) {
      throw new Error('Invalid file path');
    }

    const resolvedPath = path.resolve(process.cwd(), file);
    await fs.promises.access(resolvedPath, R_OK);

    return fs.createReadStream(resolvedPath);
  }

  async deleteFile(file: string): Promise<boolean> {
    this.logger.log(`Deleting file: ${file}`);

    // Validate the file path to prevent directory traversal
    if (file.includes('..') || path.isAbsolute(file)) {
      throw new Error('Invalid file path');
    }

    const resolvedPath = path.resolve(process.cwd(), file);
    await fs.promises.unlink(resolvedPath);
    return true;
  }
}