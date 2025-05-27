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

  private isValidPath(inputPath: string): boolean {
    // Implement a basic whitelist validation
    const allowedPaths = ['config/products/crystals/'];
    return allowedPaths.some(allowedPath => inputPath.startsWith(allowedPath));
  }

  private isValidUrl(url: string): boolean {
    // Implement a basic whitelist validation for URLs
    const allowedHosts = ['example.com']; // Add allowed hosts here
    try {
      const parsedUrl = new URL(url);
      return allowedHosts.includes(parsedUrl.hostname);
    } catch (e) {
      return false;
    }
  }

  @Get('/aws')
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
  async loadAwsFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    // Ensure the path is not pointing to internal IPs
    const internalIpRanges = ['169.254.169.254'];
    const parsedUrl = new URL(path);
    if (internalIpRanges.includes(parsedUrl.hostname)) {
      throw new BadRequestException('Access to internal IPs is not allowed');
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
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid path');
    }

    try {
      const file: Stream = await this.loadCPFile(
        CloudProvidersMetaData.AZURE,
        path
      );
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (error) {
      this.logger.error('Error loading file', error.stack);
      throw new BadRequestException('Unable to load file');
    }
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
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.DIGITAL_OCEAN,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/google')
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
  async loadGoogleFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidUrl(path)) {
      throw new BadRequestException('Invalid URL');
    }

    // Ensure the path is not pointing to internal IPs
    const internalIpRanges = ['169.254.169.254', 'metadata.google.internal'];
    const parsedUrl = new URL(path);
    if (internalIpRanges.includes(parsedUrl.hostname)) {
      throw new BadRequestException('Access to internal IPs is not allowed');
    }

    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.GOOGLE,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get()
  @ApiQuery({
    name: 'path',
    example: '/etc/hosts',
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
    description: SWAGGER_DESC_READ_FILE_ON_SERVER
  })
  async loadFile(
    @Query('path') filePath: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    // Validate the file path against a whitelist
    if (!this.isValidPath(filePath)) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      const fullPath = path.join(__dirname, filePath);
      const fileExists = fs.existsSync(fullPath);

      if (!fileExists) {
        throw new BadRequestException('File does not exist');
      }

      const fileStream = fs.createReadStream(fullPath);
      const type = this.getContentType(contentType);
      res.type(type);

      return fileStream;
    } catch (error) {
      this.logger.error('Error reading file', error.stack);
      throw new BadRequestException('Unable to read file');
    }
  }

  // Other methods remain unchanged
}
