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
