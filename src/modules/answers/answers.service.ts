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
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly websocketGateway: QuestionsConsultingGateway, // Inject WebSocket Gateway
  ) {}

  async create(createAnswerDto: CreateAnswerDto & { consultantId: string }) {
    // Verify question exists and is still open for answers
    const question = await this.questionRepository.findOne({
      where: { id: createAnswerDto.questionId },
      relations: ['user'], // Include question owner info
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if consultant already answered this question
    const existingAnswer = await this.answerRepository.findOne({
      where: {
        questionId: createAnswerDto.questionId,
        consultantId: createAnswerDto.consultantId,
      },
    });

    if (existingAnswer) {
      throw new BadRequestException('You have already answered this question');
    }

    const answer = this.answerRepository.create(createAnswerDto);
    const savedAnswer = await this.answerRepository.save(answer);

    // Update question status to 'answered' if it was pending
    if (question.status === 'pending') {
      await this.questionRepository.update(question.id, {
        status: QuestionStatusType.ANSWERED,
      });
    }

    const answerWithDetails = await this.findOneWithDetails(savedAnswer.id);

    // Send real-time notification about new answer
    try {
      await this.websocketGateway.notifyNewAnswer(
        {
          ...answerWithDetails,
          question: question, // Include question info for notification
        },
        createAnswerDto.questionId,
      );
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
      // Don't fail the request if notification fails
    }

    return answerWithDetails;
  }

  async findByQuestion(
    questionId: string,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;

    const [answers, total] = await this.answerRepository.findAndCount({
      where: { questionId },
      relations: ['consultant', 'consultant.consultantProfile'],
      order: {
        isAccepted: 'DESC', // Accepted answers first
        createdAt: 'ASC', // Then by creation date
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: answers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByConsultant(
    consultantId: string,
    options: { page: number; limit: number },
  ) {
    const { page, limit } = options;

    const [answers, total] = await this.answerRepository.findAndCount({
      where: { consultantId },
      relations: {
        question: {
          user: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: answers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['question', 'consultant', 'consultant.consultantProfile'],
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    return answer;
  }

  async findOneWithDetails(id: string) {
    return this.findOne(id);
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto, userId: string) {
    const answer = await this.answerRepository.findOne({
      where: { id },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // Only the consultant who created the answer can update it
    if (answer.consultantId !== userId) {
      throw new ForbiddenException('You can only update your own answers');
    }

    await this.answerRepository.update(id, updateAnswerDto);
    return this.findOneWithDetails(id);
  }

  async acceptAnswer(id: string, userId: string) {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['question'],
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // Only question owner can accept answers
    if (answer.question.userId !== userId) {
      throw new ForbiddenException('Only question owner can accept answers');
    }

    // Remove accepted status from other answers to this question
    await this.answerRepository.update(
      { questionId: answer.questionId },
      { isAccepted: false },
    );

    // Set this answer as accepted
    await this.answerRepository.update(id, { isAccepted: true });

    // Update question status to resolved
    await this.questionRepository.update(answer.questionId, {
      status: QuestionStatusType.RESOLVED,
    });

    return this.findOneWithDetails(id);
  }

  async voteAnswer(
    id: string,
    voteType: 'upvote' | 'downvote',
    userId: string,
  ) {
    const answer = await this.answerRepository.findOne({
      where: { id },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // TODO: Implement vote tracking to prevent duplicate votes
    // For now, simple increment/decrement
    if (voteType === 'upvote') {
      await this.answerRepository.increment({ id }, 'upvotes', 1);
    } else {
      await this.answerRepository.increment({ id }, 'downvotes', 1);
    }

    return this.findOneWithDetails(id);
  }

  async remove(id: string, userId: string) {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['question'],
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // Only consultant who created the answer can delete it
    if (answer.consultantId !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    await this.answerRepository.softDelete(id);

    // Check if this was the only answer, update question status back to pending
    const remainingAnswers = await this.answerRepository.count({
      where: { questionId: answer.questionId },
    });

    if (remainingAnswers === 0) {
      await this.questionRepository.update(answer.questionId, {
        status: QuestionStatusType.PENDING,
      });
    }

    return { message: 'Answer deleted successfully' };
  }
}
