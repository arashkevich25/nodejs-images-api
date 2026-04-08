import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Image } from './entities/image.entity';
import { ImageRepository } from './repositories/image.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/core/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
    TypeOrmModule.forFeature([Image]),
  ],
  providers: [ImageRepository],
  exports: [ImageRepository],
})
export class DatabaseModule {}
