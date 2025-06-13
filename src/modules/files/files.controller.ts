import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Logger,
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
import {
    TestUploadDto,
    UploadDocumentDto,
    UploadImageDto,
} from './dto/upload-file.dto';
import { FilesService } from './files.service';
import { UploadDocumentOptions, UploadImageOptions } from './interfaces';

@Controller('files')
export class FilesController {
    private readonly logger = new Logger(FilesController.name);
    constructor(private readonly filesService: FilesService) {}

    @Post('image')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lấy danh sách ảnh theo một đối tượng cụ thể' })
    async getImagesByEntity(
        @Query('entityType') entityType: string,
        @Query('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.filesService.getImagesByEntity(entityType, entityId);
    }

    @Get('documents/entity')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Xóa một ảnh (soft delete)' })
    async deleteImage(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteImage(id);
        return { statusCode: 200, message: 'Image deleted successfully' };
    }

    @Delete('document/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Xóa một tài liệu (soft delete)' })
    async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteDocument(id);
        return { statusCode: 200, message: 'Document deleted successfully' };
    }

    @Get('download/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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

    @Post('test/upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Test upload file to AWS S3',
        description:
            'Simple endpoint to test AWS S3 connection without entity requirements',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload for testing',
                },
                description: {
                    type: 'string',
                    description: 'Test description',
                    example: 'Test upload to AWS S3',
                },
                isPublic: {
                    type: 'string',
                    enum: ['true', 'false'],
                    default: 'true',
                    description: 'Make file publicly accessible',
                },
            },
            required: ['file'],
        },
    })
    async testUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: TestUploadDto,
    ) {
        if (!file) {
            throw new BadRequestException('File is required.');
        }

        try {
            // Convert string to boolean
            const isPublic = body.isPublic === 'true';

            // Generate test key
            const timestamp = Date.now();
            const sanitizedFileName = file.originalname.replace(
                /[^a-zA-Z0-9.-]/g,
                '_',
            );
            const testKey = `test-uploads/${timestamp}-${sanitizedFileName}`;

            // Upload directly to S3 for testing
            const uploadResult = await this.filesService
                .getAwsS3Service()
                .uploadFile(file.buffer, testKey, file.mimetype, {
                    isPublic,
                    metadata: {
                        originalName: file.originalname,
                        description: body.description || 'Test upload',
                        uploadedAt: new Date().toISOString(),
                    },
                });

            this.logger.log(`Test upload successful: ${uploadResult.key}`);

            return {
                success: true,
                message: 'File uploaded successfully to AWS S3',
                data: {
                    key: uploadResult.key,
                    url: uploadResult.url,
                    cloudFrontUrl: uploadResult.cloudFrontUrl,
                    size: uploadResult.size,
                    contentType: uploadResult.contentType,
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            this.logger.error('Test upload failed:', error);
            throw new BadRequestException(`Upload failed: ${error.message}`);
        }
    }
}
