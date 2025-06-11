import { Injectable } from '@nestjs/common';
import { CreateQuestionTagDto } from './dto/create-question-tag.dto';
import { UpdateQuestionTagDto } from './dto/update-question-tag.dto';

@Injectable()
export class QuestionTagsService {
    create(createQuestionTagDto: CreateQuestionTagDto) {
        return 'This action adds a new questionTag';
    }

    findAll() {
        return `This action returns all questionTags`;
    }

    findOne(id: number) {
        return `This action returns a #${id} questionTag`;
    }

    update(id: number, updateQuestionTagDto: UpdateQuestionTagDto) {
        return `This action updates a #${id} questionTag`;
    }

    remove(id: number) {
        return `This action removes a #${id} questionTag`;
    }
}
