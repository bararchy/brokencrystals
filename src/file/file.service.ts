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

    if (file.startsWith('/')) {
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      // Validate URL against allowed cloud provider base URLs
      const url = new URL(file);
      const isValidProvider = [
        CloudProvidersMetaData.GOOGLE,
        CloudProvidersMetaData.AZURE,
        CloudProvidersMetaData.DIGITAL_OCEAN,
        CloudProvidersMetaData.AWS
      ].some(providerUrl => file.startsWith(providerUrl));

      if (!isValidProvider) {
        throw new Error(`Access to the URL '${file}' is not allowed.`);
      }

      // Additional validation to prevent SSRF
      if (url.hostname === '169.254.169.254' || url.hostname.startsWith('127.') || url.hostname === 'localhost') {
        throw new Error('Access to internal or metadata services is not allowed.');
      }

      // Ensure the URL is using HTTPS
      if (url.protocol !== 'https:') {
        throw new Error('Only HTTPS protocol is allowed for external requests.');
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
