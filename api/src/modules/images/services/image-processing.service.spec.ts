import { ImageProcessingService } from './image-processing.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  const uploadsDir = path.join(process.cwd(), 'uploads');

  beforeEach(() => {
    service = new ImageProcessingService();
  });

  afterAll(async () => {
    const files = await fs.readdir(uploadsDir).catch(() => []);
    for (const file of files) {
      if (file.endsWith('.webp')) {
        await fs.unlink(path.join(uploadsDir, file)).catch(() => {});
      }
    }
  });

  const createTestBuffer = (): Buffer => {
    const width = 100;
    const height = 100;
    const channels = 3;
    const pixels = Buffer.alloc(width * height * channels, 0xff);

    const sharp = require('sharp');
    return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();
  };

  it('should process image and return webp', async () => {
    const buffer = await createTestBuffer();
    const file = {
      buffer,
      mimetype: 'image/png',
      originalname: 'test.png',
    } as Express.Multer.File;

    const result = await service.process(file);

    expect(result.filename).toMatch(/\.webp$/);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);

    const filePath = path.join(uploadsDir, result.filename);
    const stat = await fs.stat(filePath);
    expect(stat.isFile()).toBe(true);
  });

  it('should resize image when dimensions provided', async () => {
    const buffer = await createTestBuffer();
    const file = {
      buffer,
      mimetype: 'image/png',
      originalname: 'test.png',
    } as Express.Multer.File;

    const result = await service.process(file, 50, 50);

    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it('should resize only width when height not provided', async () => {
    const buffer = await createTestBuffer();
    const file = {
      buffer,
      mimetype: 'image/png',
      originalname: 'test.png',
    } as Express.Multer.File;

    const result = await service.process(file, 50);

    expect(result.width).toBe(50);
  });
});
