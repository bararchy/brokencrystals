import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Put,
  Query,
  Res
} from '@nestjs/common';
import {
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { W_OK } from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import { Stream } from 'stream';
import { FileService } from './file.service';
import { FastifyReply } from 'fastify';
import {
  SWAGGER_DESC_DELETE_FILE,
  SWAGGER_DESC_READ_FILE,
  SWAGGER_DESC_READ_FILE_ON_SERVER,
  SWAGGER_DESC_SAVE_RAW_CONTENT
} from './file.controller.swagger.desc';
import { CloudProvidersMetaData } from './cloud.providers.metadata';

@Controller('/api/file')
@ApiTags('Files controller')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private fileService: FileService) {}

  private getContentType(contentType: string) {
    if (contentType) {
      return contentType;
    } else {
      return 'application/octet-stream';
    }
  }

  private async loadCPFile(cpBaseUrl: string, filePath: string) {
    if (!filePath.startsWith(cpBaseUrl)) {
      throw new BadRequestException(`Invalid parameter 'path' ${filePath}`);
    }

    const file: Stream = await this.fileService.getFile(filePath);

    return file;
  }

  private isValidPath(filePath: string): boolean {
    // Implement a whitelist of allowed paths or a regex pattern to validate paths
    const allowedPaths = ['config/products/crystals/']; // Example whitelist
    return allowedPaths.some(allowedPath => filePath.startsWith(allowedPath));
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Only allow URLs that match specific domains or patterns
      const allowedDomains = ['example.com']; // Example domain whitelist
      return allowedDomains.includes(parsedUrl.hostname);
    } catch (error) {
      return false;
    }
  }

  @Get('/azure')
  @ApiQuery({
    name: 'path',
    example: 'http://example.com/resource',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadAzureFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    // Ensure the path is not pointing to internal IPs or localhost
    const parsedUrl = new URL(path);
    const forbiddenHosts = ['127.0.0.1', 'localhost', '169.254.169.254'];
    if (forbiddenHosts.includes(parsedUrl.hostname)) {
      throw new BadRequestException('Access to this URL is forbidden');
    }

    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.AZURE,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  // Other methods remain unchanged
}
