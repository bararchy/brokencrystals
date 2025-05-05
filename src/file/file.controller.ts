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
      throw new BadRequestException(`Invalid parameter 'path'`);
    }

    const file: Stream = await this.fileService.getFile(filePath);

    return file;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  private isAllowedUrl(url: string): boolean {
    // Define a whitelist of allowed base URLs
    const allowedBaseUrls = [
      CloudProvidersMetaData.AZURE,
      // Add other allowed base URLs here
    ];
    return allowedBaseUrls.some(baseUrl => url.startsWith(baseUrl));
  }

  private isValidPath(filePath: string): boolean {
    // Define a whitelist of allowed directories
    const allowedDirectories = [
      path.resolve(process.cwd(), 'public'),
      path.resolve(process.cwd(), 'uploads'),
      // Add other allowed directories here
    ];
    return allowedDirectories.some(dir => filePath.startsWith(dir));
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
        error: { type: 'string' }
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
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!this.isValidPath(resolvedPath)) {
      throw new BadRequestException('Invalid or disallowed file path');
    }

    try {
      const file: Stream = await this.loadCPFile(
        CloudProvidersMetaData.AZURE,
        resolvedPath
      );
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading file', error);
      throw new BadRequestException('Could not load file');
    }
  }

  @Get()
  @ApiQuery({
    name: 'path',
    example: 'http://example.com/file.jpg',
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
        error: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE_ON_SERVER
  })
  async loadFile(
    @Query('path') filePath: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidUrl(filePath) || !this.isAllowedUrl(filePath)) {
      throw new BadRequestException('Invalid or disallowed URL');
    }

    try {
      const file: Stream = await this.fileService.getFile(filePath);
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading file', error);
      throw new BadRequestException('Could not load file');
    }
  }

  // Other methods remain unchanged...
}
