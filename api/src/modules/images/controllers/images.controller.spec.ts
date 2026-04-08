import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from '../services/images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  let imagesService: jest.Mocked<ImagesService>;

  const mockReq = {
    protocol: 'http',
    get: jest.fn().mockReturnValue('localhost:3000'),
  } as any;

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
      controllers: [ImagesController],
      providers: [
        {
          provide: ImagesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ImagesController);
    imagesService = module.get(ImagesService);
  });

  describe('create', () => {
    const file = {
      buffer: Buffer.from('fake'),
      mimetype: 'image/png',
      originalname: 'photo.png',
    } as Express.Multer.File;

    it('should create an image with full url', async () => {
      imagesService.create.mockResolvedValue(mockImage);

      const result = await controller.create({ title: 'test image' }, file, mockReq);

      expect(result.url).toBe('http://localhost:3000/uploads/test.webp');
      expect(result.title).toBe('test image');
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(
        controller.create({ title: 'test' }, undefined as any, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated images with full urls', async () => {
      const paginatedResult = {
        data: [mockImage],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      imagesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({}, mockReq);

      expect(result.data[0].url).toBe('http://localhost:3000/uploads/test.webp');
    });
  });

  describe('findOne', () => {
    it('should return image with full url', async () => {
      imagesService.findOne.mockResolvedValue(mockImage);

      const result = await controller.findOne(mockImage.id, mockReq);

      expect(result.url).toBe('http://localhost:3000/uploads/test.webp');
    });

    it('should propagate NotFoundException', async () => {
      imagesService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('nonexistent', mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
