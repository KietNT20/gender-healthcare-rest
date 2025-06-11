import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuestionStatusType } from 'src/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new question' })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: any,
  ) {
    return this.questionsService.create({
      ...createQuestionDto,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all public questions with pagination' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('category') categoryId?: string,
    @Query('status') status?: QuestionStatusType,
    @Query('search') search?: string,
  ) {
    return this.questionsService.findAll({
      page: Number(page),
      limit: Number(limit),
      categoryId,
      status,
      search,
      isPublic: true,
    });
  }

  @Get('my-questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user questions' })
  async getMyQuestions(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.questionsService.findUserQuestions(req.user.id, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID with answers' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOneWithAnswers(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question (only by owner)' })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Request() req: any,
  ) {
    return this.questionsService.update(id, updateQuestionDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete question (only by owner)' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.questionsService.remove(id, req.user.id);
  }

  @Patch(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  async incrementView(@Param('id') id: string) {
    return this.questionsService.incrementViewCount(id);
  }
}
