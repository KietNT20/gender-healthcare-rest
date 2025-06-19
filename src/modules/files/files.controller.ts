import {
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
import { sanitizeFilename } from 'src/utils/sanitize-name.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    TestUploadDto,
    UploadDocumentDto,
    UploadDocumentMetadataDto,
    UploadImageDto,
    UploadImageMetadataDto,
} from './dto/upload-file.dto';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('image')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload an image file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadImageDto })
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadImageDto: UploadImageMetadataDto,
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
    @ApiOperation({ summary: 'Upload a document file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadDocumentDto })
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadDocumentDto: UploadDocumentMetadataDto,
    ) {
        return this.filesService.uploadDocument({
            ...uploadDocumentDto,
            file,
        });
    }

    @Get('images/entity')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a list of images by a specific entity' })
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
        summary: 'Get a list of documents by a specific entity',
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
        summary: 'Get an access URL for an image (public URL or signed URL)',
        description:
            'Returns a public URL for public images, signed URL for private images',
    })
    @ApiQuery({
        name: 'expiresIn',
        required: false,
        type: Number,
        description: 'Expiration time for signed URL (seconds), default 3600',
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
        summary: 'Get an access URL for a document (signed URL)',
        description:
            'Returns a signed URL with expiration time to access the document',
    })
    @ApiQuery({
        name: 'expiresIn',
        required: false,
        type: Number,
        description: 'Expiration time for signed URL (seconds), default 3600',
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
    @ApiOperation({ summary: 'Delete an image (soft delete)' })
    async deleteImage(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteImage(id);
        return { statusCode: 200, message: 'Image deleted successfully' };
    }

    @Delete('document/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Delete a document (soft delete)' })
    async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
        await this.filesService.deleteDocument(id);
        return { statusCode: 200, message: 'Document deleted successfully' };
    }

    @Get('download/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Download the content of a file (image or document)',
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
        const isPublic = testUploadDto.isPublic === true;
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
