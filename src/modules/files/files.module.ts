import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
    imports: [TypeOrmModule.forFeature([Document, Image]), ConfigModule],
    controllers: [FilesController],
    providers: [FilesService],
})
export class FilesModule {}
