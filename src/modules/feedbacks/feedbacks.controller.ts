import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('feedbacks')
export class FeedbacksController {
    constructor(private readonly feedbacksService: FeedbacksService) {}

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createFeedbackDto: CreateFeedbackDto) {
        return this.feedbacksService.create(createFeedbackDto);
    }

    @Get()
    async findAll() {
        return this.feedbacksService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.feedbacksService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateFeedbackDto: UpdateFeedbackDto,
    ) {
        return this.feedbacksService.update(id, updateFeedbackDto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.feedbacksService.remove(id);
    }
}
