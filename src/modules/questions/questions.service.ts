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
    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        private readonly websocketGateway: QuestionsConsultingGateway,
    ) {}

    async create(createQuestionDto: CreateQuestionDto & { userId: string }) {
        // Generate unique slug from title
        const baseSlug = slugify(createQuestionDto.title);
        let slug = baseSlug;
        let counter = 1;

        // Ensure slug uniqueness
        while (await this.questionRepository.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const question = this.questionRepository.create({
            ...createQuestionDto,
            slug,
            status: QuestionStatusType.PENDING, // Default status
        });

        const savedQuestion = await this.questionRepository.save(question);
        const questionWithDetails = await this.findOneWithDetails(
            savedQuestion.id,
        );

        // Send real-time notification about new question
        try {
            await this.websocketGateway.notifyNewQuestion(questionWithDetails);

            // TODO: Notify specific consultants based on category/expertise
            // const consultantIds = await this.getConsultantsByCategory(createQuestionDto.categoryId);
            // await this.websocketGateway.notifyConsultantsNewQuestion(questionWithDetails, consultantIds);
        } catch (error) {
            console.error('Failed to send WebSocket notification:', error);
            // Don't fail the request if notification fails
        }

        return questionWithDetails;
    }

    async findAll(options: FindAllOptions) {
        const {
            page,
            limit,
            categoryId,
            status,
            search,
            isPublic = true,
        } = options;

        const queryBuilder = this.questionRepository
            .createQueryBuilder('question')
            .leftJoinAndSelect('question.user', 'user')
            .leftJoinAndSelect('question.category', 'category')
            .leftJoinAndSelect('question.answers', 'answers')
            .leftJoinAndSelect('answers.consultant', 'consultant')
            .where('question.deletedAt IS NULL');

        if (isPublic) {
            queryBuilder.andWhere('question.isPublic = :isPublic', {
                isPublic: true,
            });
        }

        if (categoryId) {
            queryBuilder.andWhere('question.categoryId = :categoryId', {
                categoryId,
            });
        }

        if (status) {
            queryBuilder.andWhere('question.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere(
                '(question.title ILIKE :search OR question.content ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        queryBuilder.orderBy('question.createdAt', 'DESC');

        const total = await queryBuilder.getCount();
        const questions = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data: questions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findUserQuestions(
        userId: string,
        options: { page: number; limit: number },
    ) {
        const { page, limit } = options;

        const [questions, total] = await this.questionRepository.findAndCount({
            where: { user: { id: userId } },
            relations: ['category', 'answers', 'answers.consultant'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: questions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneWithAnswers(id: string) {
        const question = await this.questionRepository.findOne({
            where: { id },
            relations: [
                'user',
                'category',
                'answers',
                'answers.consultant',
                'answers.consultant.consultantProfile',
                'questionTags',
                'questionTags.tag',
            ],
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        return question;
    }

    async findOneWithDetails(id: string) {
        return this.findOneWithAnswers(id);
    }

    async update(
        id: string,
        updateQuestionDto: UpdateQuestionDto,
        userId: string,
    ) {
        const question = await this.questionRepository.findOne({
            where: { id },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        if (question.user.id !== userId) {
            throw new ForbiddenException(
                'You can only update your own questions',
            );
        }

        // Don't allow updating if question has been answered
        const hasAnswers = await this.questionRepository
            .createQueryBuilder('question')
            .leftJoin('question.answers', 'answers')
            .where('question.id = :id', { id })
            .andWhere('answers.id IS NOT NULL')
            .getCount();

        if (hasAnswers > 0) {
            throw new ForbiddenException(
                'Cannot update question that has been answered',
            );
        }

        // Update slug if title changes
        if (
            updateQuestionDto.title &&
            updateQuestionDto.title !== question.title
        ) {
            const baseSlug = slugify(updateQuestionDto.title);
            let slug = baseSlug;
            let counter = 1;

            while (
                await this.questionRepository.findOne({
                    where: { slug },
                    withDeleted: false,
                })
            ) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            updateQuestionDto.slug = slug;
        }

        await this.questionRepository.update(id, updateQuestionDto);
        return this.findOneWithDetails(id);
    }

    async remove(id: string, userId: string) {
        const question = await this.questionRepository.findOne({
            where: { id },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        // Only question owner can delete
        if (question.user.id !== userId) {
            throw new ForbiddenException(
                'You can only delete your own questions',
            );
        }

        await this.questionRepository.softDelete(id);
        return { message: 'Question deleted successfully' };
    }

    async incrementViewCount(id: string) {
        await this.questionRepository.increment({ id }, 'viewCount', 1);
        return { message: 'View count updated' };
    }

    async updateStatus(id: string, status: QuestionStatusType) {
        const question = await this.questionRepository.findOne({
            where: { id },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        await this.questionRepository.update(id, { status });
        return this.findOneWithDetails(id);
    }
}
