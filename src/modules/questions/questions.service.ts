import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { QuestionsConsultingGateway } from './questions-consulting.gateway';

interface FindAllOptions {
    page: number;
    limit: number;
    categoryId?: string;
    status?: QuestionStatusType;
    search?: string;
    isPublic?: boolean;
}

@Injectable()
export class QuestionsService {
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        private readonly websocketGateway: QuestionsConsultingGateway,
    ) {}
}
