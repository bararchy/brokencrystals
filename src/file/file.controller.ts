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

  private async loadCPFile(cpBaseUrl: string, path: string) {
    if (!path.startsWith(cpBaseUrl)) {
      throw new BadRequestException(`Invalid parameter 'path' ${path}`);
    }

    const file: Stream = await this.fileService.getFile(path);

    return file;
  }

  private isValidPath(filePath: string): boolean {
    // Implement a whitelist of allowed paths or a regex pattern to validate paths
    const basePath = path.resolve('config/products/crystals'); // Base directory
    const resolvedPath = path.resolve(basePath, filePath); // Resolve against base
    return resolvedPath.startsWith(basePath); // Ensure the resolved path is within the base directory
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

  @Get('/aws')
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
  async loadAwsFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid file path');
    }

    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.AWS,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/azure')
  @ApiQuery({
    name: 'path',
    example: 'https://example.com/resource',
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

    const file: Stream = await this.fileService.getFile(path);
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/digital_ocean')
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
  async loadDigitalOceanFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Fix: Validate the URL using a whitelist approach
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    const file: Stream = await this.fileService.getFile(path);
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/google')
  @ApiQuery({
    name: 'path',
    example: 'http://metadata.google.internal/computeMetadata/v1/',
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
  async loadGoogleFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Fix: Validate the URL using a whitelist approach
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    const file: Stream = await this.fileService.getFile(path);
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get()
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
  async loadFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Fix: Validate the path using a whitelist approach
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid file path');
    }

    const file: Stream = await this.fileService.getFile(path);
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  // Other methods remain unchanged
}
