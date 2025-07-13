import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
    UploadPublicPdfDto,
    UploadPublicPdfMetadataDto,
} from './dto/upload-file.dto';
import { FileResult } from './interfaces';
import { PublicPdfService } from './public-pdf.service';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('public-pdfs')
export class PublicPdfController {
    constructor(private readonly publicPdfService: PublicPdfService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Upload a public PDF file',
        description: 'Upload a PDF file to public bucket for direct access',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'PDF file and metadata',
        type: UploadPublicPdfDto,
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'PDF uploaded successfully',
    })
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.MANAGER,
    ])
    async uploadPublicPdf(
        @UploadedFile() file: Express.Multer.File,
        @Body() uploadPublicPdfBodyDto: UploadPublicPdfMetadataDto,
    ): Promise<FileResult> {
        return this.publicPdfService.uploadPublicPdf(
            file,
            uploadPublicPdfBodyDto,
        );
    }

    @Get('entity/:entityType/:entityId')
    @ApiOperation({
        summary: 'Get public PDFs by entity',
        description: 'Retrieve all public PDFs for a specific entity',
    })
    @ApiParam({
        name: 'entityType',
        description: 'Type of entity',
        example: 'blog',
    })
    @ApiParam({
        name: 'entityId',
        description: 'ID of the entity',
        example: 'uuid-string',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of public PDFs',
        type: Array,
    })
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CUSTOMER,
    ])
    async getPublicPdfsByEntity(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        return this.publicPdfService.getPublicPdfsByEntity(
            entityType,
            entityId,
        );
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get public PDF details with access URL',
        description: 'Get public PDF information with direct access URL',
    })
    @ApiParam({
        name: 'id',
        description: 'PDF document ID',
        example: 'uuid-string',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'PDF details with access URL',
    })
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CUSTOMER,
    ])
    async getPublicPdf(@Param('id') id: string) {
        return this.publicPdfService.getPublicPdfWithAccessUrl(id);
    }

    @Get(':id/download')
    @ApiOperation({
        summary: 'Download public PDF file',
        description: 'Download the actual PDF file content',
    })
    @ApiParam({
        name: 'id',
        description: 'PDF document ID',
        example: 'uuid-string',
    })
    @ApiQuery({
        name: 'inline',
        required: false,
        description: 'Display inline in browser instead of download',
        type: Boolean,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'PDF file content',
        headers: {
            'Content-Type': {
                description: 'application/pdf',
                schema: { type: 'string' },
            },
            'Content-Disposition': {
                description: 'attachment; filename="filename.pdf"',
                schema: { type: 'string' },
            },
        },
    })
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.MANAGER,
        RolesNameEnum.CUSTOMER,
    ])
    async downloadPublicPdf(
        @Param('id') id: string,
        @Query('inline') inline: boolean = false,
        @Res() res: Response,
    ) {
        const { buffer, filename, mimeType } =
            await this.publicPdfService.downloadPublicPdf(id);

        const disposition = inline ? 'inline' : 'attachment';
        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `${disposition}; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
        });

        res.send(buffer);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete public PDF',
        description: 'Delete a public PDF file from storage and database',
    })
    @ApiParam({
        name: 'id',
        description: 'PDF document ID',
        example: 'uuid-string',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'PDF deleted successfully',
    })
    @Roles([
        RolesNameEnum.ADMIN,
        RolesNameEnum.CONSULTANT,
        RolesNameEnum.MANAGER,
    ])
    async deletePublicPdf(@Param('id') id: string) {
        await this.publicPdfService.deletePublicPdf(id);
        return { message: 'Public PDF deleted successfully' };
    }
}
