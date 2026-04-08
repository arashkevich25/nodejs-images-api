import { Repository } from 'typeorm';
import { ImageRepository } from './image.repository';
import { Image } from '../entities/image.entity';

describe('ImageRepository', () => {
  let repository: ImageRepository;
  let mockRepo: jest.Mocked<Repository<Image>>;

  const image: Image = {
    id: '1',
    title: 'sunset',
    url: '/uploads/test.webp',
    width: 800,
    height: 600,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    repository = new ImageRepository(mockRepo as any);
  });

  describe('findByTitle', () => {
    it('should find images by title with pagination', async () => {
      mockRepo.findAndCount.mockResolvedValue([[image], 1]);

      const result = await repository.findByTitle('sun', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([image]);
      expect(result.total).toBe(1);
      expect(mockRepo.findAndCount).toHaveBeenCalled();
    });
  });
});
