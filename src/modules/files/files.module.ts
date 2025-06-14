import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../documents/entities/document.entity';
import { Image } from '../images/entities/image.entity';
import { AwsS3Service } from './aws-s3.service';
import awsConfig from './config/aws.config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ImageProcessor } from './processors/image.processor';

@Module({
    imports: [
        TypeOrmModule.forFeature([Document, Image]),
        ConfigModule.forFeature(awsConfig),
        BullModule.registerQueue({
            name: 'image-processing',
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService, AwsS3Service, ImageProcessor],
    exports: [FilesService, AwsS3Service],
})
export class FilesModule {}
