import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UploadedFile,
  Body,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as express from 'express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ImagesService } from '../services/images.service';
import { CreateImageDto } from '../dto/create-image.dto';
import { GetImagesDto } from '../dto/get-images.dto';
import {
  ImageResponseDto,
  PaginatedImagesResponseDto,
} from '../dto/image-response.dto';
import { Image } from '../../../core/database/entities/image.entity';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image', 'title'],
      properties: {
        image: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        width: { type: 'integer', minimum: 1 },
        height: { type: 'integer', minimum: 1 },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or unsupported format' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported image format'), false);
        }
      },
    }),
  )
  async create(
    @Body() dto: CreateImageDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: express.Request,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const image = await this.imagesService.create(dto, file);
    return this.withFullUrl(req, image);
  }

  @Get()
  @ApiOperation({ summary: 'List images' })
  @ApiResponse({ status: 200, type: PaginatedImagesResponseDto })
  async findAll(@Query() dto: GetImagesDto, @Req() req: express.Request) {
    const result = await this.imagesService.findAll(dto);
    return {
      ...result,
      data: result.data.map((image) => this.withFullUrl(req, image)),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get image by id' })
  @ApiResponse({ status: 200, type: ImageResponseDto })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: express.Request) {
    const image = await this.imagesService.findOne(id);
    return this.withFullUrl(req, image);
  }

  private withFullUrl(req: express.Request, image: Image) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return { ...image, url: `${baseUrl}${image.url}` };
  }
}
