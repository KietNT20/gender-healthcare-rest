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
} from '@nestjs/common';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('feedbacks')
export class FeedbacksController {
    constructor(private readonly feedbacksService: FeedbacksService) {}

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

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateFeedbackDto: UpdateFeedbackDto,
    ) {
        return this.feedbacksService.update(id, updateFeedbackDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.feedbacksService.remove(id);
    }
    
}