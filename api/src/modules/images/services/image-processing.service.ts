import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ProcessedImage {
  filename: string;
  width: number;
  height: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  async process(
    file: Express.Multer.File,
    width?: number,
    height?: number,
  ): Promise<ProcessedImage> {
    await fs.mkdir(this.uploadsDir, { recursive: true });

    const ext = '.webp';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const outputPath = path.join(this.uploadsDir, filename);

    let pipeline = sharp(file.buffer);

    if (width || height) {
      pipeline = pipeline.resize(width || null, height || null, {
        fit: 'cover',
      });
    }

    const result = await pipeline
      .webp({ quality: 80 })
      .toFile(outputPath);

    return {
      filename,
      width: result.width,
      height: result.height,
    };
  }
}
