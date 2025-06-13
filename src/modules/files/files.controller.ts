import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadDocumentDto, UploadImageDto } from './dto/upload-file.dto';
import { FilesService } from './files.service';
import { UploadDocumentOptions, UploadImageOptions } from './interfaces';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Tải lên một file ảnh và đưa vào hàng đợi xử lý' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadImageDto })
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: UploadImageDto,
    ) {
        if (!body.entityId || !body.entityType) {
            throw new BadRequestException(
                'entityId and entityType are required fields.',
            );
        }
        if (!file) {
            throw new BadRequestException('File is required.');
        }

        const options: UploadImageOptions = {
            file,
            entityId: body.entityId,
            entityType: body.entityType,
            altText: body.altText,
            isPublic: body.isPublic,
            generateThumbnails: body.generateThumbnails,
        };
        return this.filesService.uploadImage(options);
    }

    @Post('document')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Tải lên một file tài liệu' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadDocumentDto })
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: UploadDocumentDto,
    ) {
        if (!body.entityId || !body.entityType) {
            throw new BadRequestException(
                'entityId and entityType are required fields.',
            );
        }
        if (!file) {
            throw new BadRequestException('File is required.');
        }

        const options: UploadDocumentOptions = {
            file,
            entityId: body.entityId,
            entityType: body.entityType,
            description: body.description,
            isPublic: body.isPublic,
            isSensitive: body.isSensitive,
        };
        return this.filesService.uploadDocument(options);
    }

    @Get('images/entity')
    @ApiOperation({ summary: 'Lấy danh sách ảnh theo một đối tượng cụ thể' })
    async getImagesByEntity(
        @Query('entityType') entityType: string,
        @Query('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.filesService.getImagesByEntity(entityType, entityId);
    }

    @Get('documents/entity')
    @ApiOperation({
        summary: 'Lấy danh sách tài liệu theo một đối tượng cụ thể',
    })
    async getDocumentsByEntity(
        @Query('entityType') entityType: string,
        @Query('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.filesService.getDocumentsByEntity(entityType, entityId);
    }

    @Delete('image/:id')
    @ApiOperation({ summary: 'Xóa một ảnh (soft delete)' })
    async deleteImage(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteImage(id);
        return { statusCode: 200, message: 'Image deleted successfully' };
    }

    @Delete('document/:id')
    @ApiOperation({ summary: 'Xóa một tài liệu (soft delete)' })
    async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteDocument(id);
        return { statusCode: 200, message: 'Document deleted successfully' };
    }

    @Get('download/:id')
    @ApiOperation({
        summary: 'Tải về nội dung của một file (ảnh hoặc tài liệu)',
    })
    @ApiQuery({ name: 'type', required: true, enum: ['image', 'document'] })
    async downloadFile(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('type') type: 'image' | 'document',
        @Res() res: Response,
    ) {
        const fileData = await this.filesService.downloadFile(id, type);
        res.setHeader('Content-Type', fileData.mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${fileData.filename}"`,
        );
        res.send(fileData.buffer);
    }
}
