import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImagesService } from './images.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Get('entity/:entityType/:entityId')
    @ApiOperation({ summary: 'Get all images for a specific entity' })
    @ResponseMessage('Images for entity retrieved successfully.')
    findByEntity(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseUUIDPipe) entityId: string,
    ) {
        return this.imagesService.findByEntity(entityType, entityId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get image metadata by ID' })
    @ResponseMessage('Image metadata retrieved successfully.')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.imagesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update image metadata (e.g., alt text)' })
    @ResponseMessage('Image metadata updated successfully.')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateImageDto: UpdateImageDto,
    ) {
        return this.imagesService.update(id, updateImageDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an image and its file from storage' })
    @ResponseMessage('Image deleted successfully.')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.imagesService.remove(id);
    }
}
