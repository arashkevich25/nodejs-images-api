import { Test, TestingModule } from '@nestjs/testing';
import {
  Global,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { ImagesModule } from '../src/modules/images/images.module';
import { Image } from '../src/core/database/entities/image.entity';
import { ImageRepository } from '../src/core/database/repositories/image.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Image],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Image]),
  ],
  providers: [ImageRepository],
  exports: [ImageRepository],
})
class TestDatabaseModule {}

describe('Images (e2e)', () => {
  let app: INestApplication<App>;
  let createdImageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, ImagesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /images', () => {
    it('should upload an image', async () => {
      const sharp = require('sharp');
      const buffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: '#ff0000' },
      })
        .png()
        .toBuffer();

      const response = await request(app.getHttpServer())
        .post('/images')
        .field('title', 'Test Image')
        .attach('image', buffer, 'test.png')
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Test Image',
        url: expect.stringMatching(/^http:\/\/.+\/uploads\/.+\.webp$/),
        width: expect.any(Number),
        height: expect.any(Number),
      });
      expect(response.body.id).toBeDefined();

      createdImageId = response.body.id;
    });

    it('should upload and resize an image', async () => {
      const sharp = require('sharp');
      const buffer = await sharp({
        create: { width: 200, height: 200, channels: 3, background: '#00ff00' },
      })
        .png()
        .toBuffer();

      const response = await request(app.getHttpServer())
        .post('/images')
        .field('title', 'Resized Image')
        .field('width', '50')
        .field('height', '50')
        .attach('image', buffer, 'resize.png')
        .expect(201);

      expect(response.body.width).toBe(50);
      expect(response.body.height).toBe(50);
    });

    it('should reject request without file', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'No file')
        .expect(400);
    });

    it('should reject request without title', async () => {
      const sharp = require('sharp');
      const buffer = await sharp({
        create: { width: 10, height: 10, channels: 3, background: '#000' },
      })
        .png()
        .toBuffer();

      await request(app.getHttpServer())
        .post('/images')
        .attach('image', buffer, 'test.png')
        .expect(400);
    });

    it('should reject unsupported file format', async () => {
      await request(app.getHttpServer())
        .post('/images')
        .field('title', 'Bad format')
        .attach('image', Buffer.from('not an image'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });
  });

  describe('GET /images', () => {
    it('should return paginated list of images', async () => {
      const response = await request(app.getHttpServer())
        .get('/images')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 20,
        totalPages: expect.any(Number),
      });

      const image = response.body.data[0];
      expect(image).toHaveProperty('id');
      expect(image).toHaveProperty('title');
      expect(image).toHaveProperty('url');
      expect(image).toHaveProperty('width');
      expect(image).toHaveProperty('height');
    });

    it('should filter by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/images')
        .query({ title: 'Resized' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((img: any) => {
        expect(img.title.toLowerCase()).toContain('resized');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get('/images')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.limit).toBe(1);
    });

    it('should reject invalid pagination params', async () => {
      await request(app.getHttpServer())
        .get('/images')
        .query({ page: -1 })
        .expect(400);
    });
  });

  describe('GET /images/:id', () => {
    it('should return image by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/images/${createdImageId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdImageId,
        title: 'Test Image',
        url: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
      });
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/images/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer()).get('/images/not-a-uuid').expect(400);
    });
  });
});
