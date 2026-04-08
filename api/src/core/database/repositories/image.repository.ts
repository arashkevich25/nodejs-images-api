import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Like, Repository } from 'typeorm';
import { Image } from '../entities/image.entity';
import { BaseRepository } from './base.repository';
import { PaginatedResult, PaginationOptions } from '../../../common/types/pagination';

@Injectable()
export class ImageRepository extends BaseRepository<Image> {
  constructor(
    @InjectRepository(Image)
    repository: Repository<Image>,
  ) {
    super(repository);
  }

  async findByTitle(
    title: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Image>> {
    const where: FindManyOptions<Image> = {
      where: { title: Like(`%${title}%`) },
    };
    return this.findPaginated(pagination, where);
  }
}
