import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImageRepository } from '../../../core/database/repositories/image.repository';
import { ImageProcessingService } from './image-processing.service';

describe('ImagesService', () => {
  let service: ImagesService;
  let imageRepository: jest.Mocked<ImageRepository>;
  let imageProcessingService: jest.Mocked<ImageProcessingService>;

  const mockImage = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'test image',
    url: '/uploads/test.webp',
    width: 800,
    height: 600,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        {
          provide: ImageRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findPaginated: jest.fn(),
            findByTitle: jest.fn(),
          },
        },
        {
          provide: ImageProcessingService,
          useValue: {
            process: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ImagesService);
    imageRepository = module.get(ImageRepository);
    imageProcessingService = module.get(ImageProcessingService);
  });

  describe('create', () => {
    const file = {
      buffer: Buffer.from('fake'),
      mimetype: 'image/png',
      originalname: 'photo.png',
    } as Express.Multer.File;

    it('should process the image and save to database', async () => {
      imageProcessingService.process.mockResolvedValue({
        filename: '123-abc.webp',
        width: 800,
        height: 600,
      });
      imageRepository.create.mockResolvedValue(mockImage);

      const result = await service.create({ title: 'test image' }, file);

      expect(imageProcessingService.process).toHaveBeenCalledWith(
        file,
        undefined,
        undefined,
      );
      expect(imageRepository.create).toHaveBeenCalledWith({
        title: 'test image',
        url: '/uploads/123-abc.webp',
        width: 800,
        height: 600,
      });
      expect(result).toEqual(mockImage);
    });

    it('should pass width and height to processing service', async () => {
      imageProcessingService.process.mockResolvedValue({
        filename: '123-abc.webp',
        width: 200,
        height: 100,
      });
      imageRepository.create.mockResolvedValue(mockImage);

      await service.create({ title: 'resized', width: 200, height: 100 }, file);

      expect(imageProcessingService.process).toHaveBeenCalledWith(
        file,
        200,
        100,
      );
    });
  });

  describe('findAll', () => {
    const paginatedResult = {
      data: [mockImage],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should return paginated results', async () => {
      imageRepository.findPaginated.mockResolvedValue(paginatedResult);

      const result = await service.findAll({});

      expect(imageRepository.findPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should filter by title when provided', async () => {
      imageRepository.findByTitle.mockResolvedValue(paginatedResult);

      const result = await service.findAll({ title: 'test' });

      expect(imageRepository.findByTitle).toHaveBeenCalledWith('test', {
        page: 1,
        limit: 20,
      });
      expect(result).toEqual(paginatedResult);
    });

    it('should use custom pagination params', async () => {
      imageRepository.findPaginated.mockResolvedValue(paginatedResult);

      await service.findAll({ page: 3, limit: 50 });

      expect(imageRepository.findPaginated).toHaveBeenCalledWith({
        page: 3,
        limit: 50,
      });
    });
  });

  describe('findOne', () => {
    it('should return image by id', async () => {
      imageRepository.findById.mockResolvedValue(mockImage);

      const result = await service.findOne(mockImage.id);

      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException when image not found', async () => {
      imageRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
