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

    if (this.isSvnPath(file) || this.isHgPath(file) || this.isGitPath(file)) {
      throw new Error('Access to SVN, Mercurial, or Git paths is forbidden');
    }

    if (file.startsWith('/')) {
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      // Validate URL to prevent SSRF
      const url = new URL(file);
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // Allow only specific hostnames
      const allowedHosts = ['example.com', 'another-allowed-host.com'];
      if (!allowedHosts.includes(url.hostname)) {
        throw new Error('Hostname not allowed');
      }

      // Ensure the path is not accessing sensitive metadata
      const forbiddenPaths = ['/latest/meta-data/', '/latest/user-data/'];
      if (forbiddenPaths.some(forbiddenPath => url.pathname.startsWith(forbiddenPath))) {
        throw new Error('Access to this path is forbidden');
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

  private isSvnPath(file: string): boolean {
    return file.includes('.svn');
  }

  private isHgPath(file: string): boolean {
    return file.includes('.hg');
  }

  private isGitPath(file: string): boolean {
    return file.includes('.git');
  }
}