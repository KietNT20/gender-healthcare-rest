import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesService } from './images.service';

@ApiTags('Images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}
}
