import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import {
    BulkUploadDto,
    FileUploadResponseDto,
    UploadDocumentDto,
    UploadImageDto,
} from './dto/upload-file.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
    constructor(private readonly filesService: FilesService) {}

    @Post('upload-image')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload an image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                altText: {
                    type: 'string',
                    description: 'Alternative text for the image',
                },
                entityType: {
                    type: 'string',
                    description: 'Entity type this image belongs to',
                },
                entityId: {
                    type: 'string',
                    description: 'Entity ID this image belongs to',
                },
                generateThumbnails: {
                    type: 'boolean',
                    description: 'Whether to generate thumbnails',
                    default: true,
                },
                isPublic: {
                    type: 'boolean',
                    description: 'Whether this image is public',
                    default: true,
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Image uploaded successfully',
        type: FileUploadResponseDto,
    })
    @ResponseMessage('Image uploaded successfully')
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadDto: UploadImageDto,
        @CurrentUser() user: User,
    ): Promise<FileUploadResponseDto> {
        return this.filesService.uploadImage(file, uploadDto, user.id);
    }

    @Post('upload-document')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a document' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                name: {
                    type: 'string',
                    description: 'Document name/title',
                },
                description: {
                    type: 'string',
                    description: 'Document description',
                },
                documentType: {
                    type: 'string',
                    description: 'Document type/category',
                },
                entityType: {
                    type: 'string',
                    description: 'Entity type this document belongs to',
                },
                entityId: {
                    type: 'string',
                    description: 'Entity ID this document belongs to',
                },
                isPublic: {
                    type: 'boolean',
                    description: 'Whether this document is public',
                    default: false,
                },
                isSensitive: {
                    type: 'boolean',
                    description:
                        'Whether this document contains sensitive information',
                    default: false,
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Document uploaded successfully',
        type: FileUploadResponseDto,
    })
    @ResponseMessage('Document uploaded successfully')
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadDto: UploadDocumentDto,
        @CurrentUser() user: User,
    ): Promise<FileUploadResponseDto> {
        return this.filesService.uploadDocument(file, uploadDto, user.id);
    }

    @Post('upload-bulk')
    @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
    @ApiOperation({ summary: 'Upload multiple files' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
                entityType: {
                    type: 'string',
                    description: 'Entity type for all files',
                },
                entityId: {
                    type: 'string',
                    description: 'Entity ID for all files',
                },
                isPublic: {
                    type: 'boolean',
                    description: 'Whether all files are public',
                    default: false,
                },
            },
            required: ['files'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Files uploaded successfully',
        type: [FileUploadResponseDto],
    })
    @ResponseMessage('Files uploaded successfully')
    async uploadMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() uploadDto: BulkUploadDto,
        @CurrentUser() user: User,
    ): Promise<FileUploadResponseDto[]> {
        return this.filesService.uploadMultipleFiles(files, uploadDto, user.id);
    }
}
