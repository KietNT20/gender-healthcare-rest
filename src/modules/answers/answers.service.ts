import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../questions/entities/question.entity';
import { QuestionsConsultingGateway } from '../questions/questions-consulting.gateway';
import { Answer } from './entities/answer.entity';

@Injectable()
export class AnswersService {
    constructor(
        @InjectRepository(Answer)
        private readonly answerRepository: Repository<Answer>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        private readonly websocketGateway: QuestionsConsultingGateway,
    ) {}
}
