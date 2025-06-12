import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { QuestionStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
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
    
}
