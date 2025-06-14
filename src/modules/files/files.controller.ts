import {
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
import { sanitizeFilename } from 'src/utils/sanitize-name.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    TestUploadDto,
    UploadDocumentDto,
    UploadImageDto,
} from './dto/upload-file.dto';
import { FilesService } from './files.service';

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
        @Body() uploadImageDto: UploadImageDto,
    ) {
        return this.filesService.uploadImage({
            ...uploadImageDto,
            file,
        });
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
        @Body() uploadDocumentDto: UploadDocumentDto,
    ) {
        return this.filesService.uploadDocument({
            ...uploadDocumentDto,
            file,
        });
    }

    @Get('images/entity')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Lấy danh sách ảnh theo một đối tượng cụ thể' })
    @ApiQuery({
        name: 'includePrivate',
        required: false,
        type: Boolean,
        description: 'Include private images (admin only)',
    })
    async getImagesByEntity(
        @Query('entityType') entityType: string,
        @Query('entityId', ParseUUIDPipe) entityId: string,
        @Query('includePrivate') includePrivate: boolean = false,
    ) {
        return this.filesService.getImagesByEntity(
            entityType,
            entityId,
            includePrivate,
        );
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

    @Get('image/:id/access')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Lấy URL truy cập cho ảnh (public URL hoặc signed URL)',
        description:
            'Trả về public URL cho ảnh công khai, signed URL cho ảnh riêng tư',
    })
    @ApiQuery({
        name: 'expiresIn',
        required: false,
        type: Number,
        description: 'Thời gian hết hạn cho signed URL (giây), mặc định 3600',
    })
    async getImageAccessUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('expiresIn') expiresIn: number = 3600,
    ) {
        return this.filesService.getImageWithAccessUrl(id, expiresIn);
    }

    @Get('document/:id/access')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Lấy URL truy cập cho tài liệu (signed URL)',
        description:
            'Trả về signed URL với thời gian hết hạn để truy cập tài liệu',
    })
    @ApiQuery({
        name: 'expiresIn',
        required: false,
        type: Number,
        description: 'Thời gian hết hạn cho signed URL (giây), mặc định 3600',
    })
    async getDocumentAccessUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('expiresIn') expiresIn: number = 3600,
    ) {
        return this.filesService.getDocumentWithAccessUrl(id, expiresIn);
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
    @ApiOperation({ summary: 'Test upload file to AWS S3' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: TestUploadDto })
    async testUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body() testUploadDto: TestUploadDto,
    ) {
        const isPublic = testUploadDto.isPublic;
        const cleanName = sanitizeFilename(file.originalname);
        const testKey = `test-uploads/${Date.now()}-${cleanName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const uploadResult = await this.filesService
            .getAwsS3Service()
            .uploadFileWithPrivacy(
                file.buffer,
                testKey,
                file.mimetype,
                isPublic,
                {
                    metadata: {
                        originalName: cleanName,
                        description: testUploadDto.description || '',
                        uploadedAt: new Date().toISOString(),
                    },
                },
            );

        return {
            success: true,
            message: 'File uploaded successfully to AWS S3',
            data: {
                ...uploadResult,
                originalName: file.originalname,
                uploadedAt: new Date().toISOString(),
            },
        };
    }
}
