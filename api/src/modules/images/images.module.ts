import { Module } from '@nestjs/common';
import { ImagesController } from './controllers/images.controller';
import { ImagesService } from './services/images.service';
import { ImageProcessingService } from './services/image-processing.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, ImageProcessingService],
})
export class ImagesModule {}
