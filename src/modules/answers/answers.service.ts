import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionStatusType } from 'src/enums';
import { Repository } from 'typeorm';
import { Question } from '../questions/entities/question.entity';
import { QuestionsConsultingGateway } from '../questions/questions-consulting.gateway';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { Answer } from './entities/answer.entity';

@Injectable()
export class AnswersService {
  
}
