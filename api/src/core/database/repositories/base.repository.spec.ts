import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { BaseEntity } from '../entities/base.entity';

class TestEntity extends BaseEntity {
  name: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(repo: Repository<TestEntity>) {
    super(repo);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockRepo: jest.Mocked<Repository<TestEntity>>;

  const entity: TestEntity = {
    id: '1',
    name: 'test',
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
    repository = new TestRepository(mockRepo);
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(entity);
      const result = await repository.findById('1');
      expect(result).toEqual(entity);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });

    it('should return null when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await repository.findById('999');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all entities', async () => {
      mockRepo.find.mockResolvedValue([entity]);
      const result = await repository.findAll();
      expect(result).toEqual([entity]);
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      mockRepo.findAndCount.mockResolvedValue([[entity], 1]);
      const result = await repository.findPaginated({ page: 1, limit: 10 });
      expect(result).toEqual({
        data: [entity],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });

    it('should calculate skip correctly for page 2', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      await repository.findPaginated({ page: 2, limit: 5 });
      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
      });
    });

    it('should pass where options', async () => {
      mockRepo.findAndCount.mockResolvedValue([[entity], 1]);
      await repository.findPaginated(
        { page: 1, limit: 10 },
        { where: { name: 'test' } as any },
      );
      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        where: { name: 'test' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('create', () => {
    it('should create and save entity', async () => {
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);
      const result = await repository.create({ name: 'test' } as any);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update and return entity', async () => {
      mockRepo.update.mockResolvedValue({} as any);
      mockRepo.findOneBy.mockResolvedValue(entity);
      const result = await repository.update('1', { name: 'updated' } as any);
      expect(result).toEqual(entity);
    });

    it('should return null if entity not found after update', async () => {
      mockRepo.update.mockResolvedValue({} as any);
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await repository.update('999', { name: 'x' } as any);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return true when deleted', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await repository.delete('1');
      expect(result).toBe(true);
    });

    it('should return false when not found', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 0 } as any);
      const result = await repository.delete('999');
      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      mockRepo.delete.mockResolvedValue({} as any);
      const result = await repository.delete('1');
      expect(result).toBe(false);
    });
  });
});
