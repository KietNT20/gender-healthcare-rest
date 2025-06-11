import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { QuestionTagsService } from './question-tags.service';
import { CreateQuestionTagDto } from './dto/create-question-tag.dto';
import { UpdateQuestionTagDto } from './dto/update-question-tag.dto';

@Controller('question-tags')
export class QuestionTagsController {
    constructor(private readonly questionTagsService: QuestionTagsService) {}

    @Post()
    create(@Body() createQuestionTagDto: CreateQuestionTagDto) {
        return this.questionTagsService.create(createQuestionTagDto);
    }

    @Get()
    findAll() {
        return this.questionTagsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.questionTagsService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateQuestionTagDto: UpdateQuestionTagDto,
    ) {
        return this.questionTagsService.update(+id, updateQuestionTagDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.questionTagsService.remove(+id);
    }
}
