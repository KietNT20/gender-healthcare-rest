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
import { THIRTY_DAYS } from 'src/constant';
import { sanitizeFilename } from 'src/utils/sanitize-name.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    TestUploadDto,
    UploadDocumentDto,
    UploadDocumentMetadataDto,
    UploadImageDto,
    UploadImageMetadataDto,
    UploadPublicPdfDto,
    UploadPublicPdfMetadataDto,
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

    @Post('public-pdf')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Upload a public PDF file',
        description:
            'Upload a PDF file to public bucket for direct access without queue processing',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadPublicPdfDto })
    async uploadPublicPdf(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadPdfDto: UploadPublicPdfMetadataDto,
    ) {
        return this.filesService.uploadPublicPdf({
            file,
            entityType: uploadPdfDto.entityType,
            entityId: uploadPdfDto.entityId,
            description: uploadPdfDto.description,
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

    @Get('public-pdfs/entity')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get a list of public PDFs by a specific entity',
        description: 'Retrieve all public PDF files for a specific entity',
    })
    async getPublicPdfsByEntity(
        @Query('entityType') entityType: string,
        @Query('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.filesService.getPublicPdfsByEntity(entityType, entityId);
    }

    @Get('public-pdf/:id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get public PDF details with access URL',
        description: 'Get public PDF information with direct access URL',
    })
    async getPublicPdf(@Param('id', ParseUUIDPipe) id: string) {
        return this.filesService.getPublicPdfWithAccessUrl(id);
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
        description:
            'Expiration time for signed URL (seconds), default 30 days',
    })
    async getImageAccessUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('expiresIn') expiresIn: number = THIRTY_DAYS,
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
        description:
            'Expiration time for signed URL (seconds), default 30 days',
    })
    async getDocumentAccessUrl(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('expiresIn') expiresIn: number = THIRTY_DAYS,
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

    @Get('public-pdf/:id/download')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Download public PDF file',
        description: 'Download the actual PDF file content',
    })
    @ApiQuery({
        name: 'inline',
        required: false,
        description: 'Display inline in browser instead of download',
        type: Boolean,
    })
    async downloadPublicPdf(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('inline') inline: boolean = false,
        @Res() res: Response,
    ) {
        const { buffer, filename, mimeType } =
            await this.filesService.downloadFile(id, 'document');

        const disposition = inline ? 'inline' : 'attachment';
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `${disposition}; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
        });

        res.send(buffer);
    }

    @Post('test/upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Test upload file to AWS S3',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: TestUploadDto })
    async testUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body() testUploadDto: TestUploadDto,
    ) {
        const isPublic = testUploadDto.isPublic === true;
        const cleanName = sanitizeFilename(file.originalname);
        const testKey = `test-uploads/${Date.now()}-${cleanName.replace(
            /[^a-zA-Z0-9.-]/g,
            '_',
        )}`;

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
