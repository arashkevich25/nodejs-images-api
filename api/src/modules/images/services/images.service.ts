import { Injectable, NotFoundException } from '@nestjs/common';
import { ImageRepository } from '../../../core/database/repositories/image.repository';
import { Image } from '../../../core/database/entities/image.entity';
import { ImageProcessingService } from './image-processing.service';
import { CreateImageDto } from '../dto/create-image.dto';
import { GetImagesDto } from '../dto/get-images.dto';
import { PaginatedResult } from '../../../common/types/pagination';

@Injectable()
export class ImagesService {
  constructor(
    private readonly imageRepository: ImageRepository,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  async create(dto: CreateImageDto, file: Express.Multer.File): Promise<Image> {
    const processed = await this.imageProcessingService.process(
      file,
      dto.width,
      dto.height,
    );

    return this.imageRepository.create({
      title: dto.title,
      url: `/uploads/${processed.filename}`,
      width: processed.width,
      height: processed.height,
    });
  }

  async findAll(dto: GetImagesDto): Promise<PaginatedResult<Image>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    if (dto.title) {
      return this.imageRepository.findByTitle(dto.title, { page, limit });
    }

    return this.imageRepository.findPaginated({ page, limit });
  }

  async findOne(id: string): Promise<Image> {
    const image = await this.imageRepository.findById(id);

    if (!image) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }

    return image;
  }
}
