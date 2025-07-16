import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from 'src/constant';
import { Document } from '../documents/entities/document.entity';
import { Image } from '../images/entities/image.entity';
import { AwsS3Service } from './aws-s3.service';
import awsConfig from './config/aws.config';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ImageProcessor } from './processors/image.processor';
import { PublicPdfService } from './public-pdf.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Document, Image]),
        ConfigModule.forFeature(awsConfig),
        BullModule.registerQueue({
            name: QUEUE_NAMES.IMAGE_PROCESSING,
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService, AwsS3Service, ImageProcessor, PublicPdfService],
    exports: [FilesService, AwsS3Service, PublicPdfService],
})
export class FilesModule {}
