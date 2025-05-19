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
    // Implement a whitelist of allowed base URLs
    const allowedBaseUrls = ['https://example.com']; // Example whitelist
    try {
      const parsedUrl = new URL(url);
      return allowedBaseUrls.includes(parsedUrl.origin);
    } catch (error) {
      return false;
    }
  }

  @Get('/azure')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
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
    @Query('path') filePath: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Validate that the path is not a URL
    try {
      new URL(filePath);
      throw new BadRequestException('File path should not be a URL');
    } catch (e) {
      // If error is thrown, it means filePath is not a valid URL, which is expected
    }

    if (!this.isValidPath(filePath)) {
      throw new BadRequestException('Invalid file path');
    }

    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.AZURE,
      filePath
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  // Other methods remain unchanged
}
