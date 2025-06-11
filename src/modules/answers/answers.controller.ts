import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnswersService } from './answers.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.CONSULTANT, RolesNameEnum.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create answer (consultant only)' })
  create(@Body() createAnswerDto: CreateAnswerDto, @Request() req: any) {
    return this.answersService.create({
      ...createAnswerDto,
      consultantId: req.user.id,
    });
  }

  @Get('question/:questionId')
  @ApiOperation({ summary: 'Get all answers for a question' })
  findByQuestion(
    @Param('questionId') questionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.answersService.findByQuestion(questionId, {
      page,
      limit,
    });
  }

  @Get('my-answers')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.CONSULTANT, RolesNameEnum.ADMIN])
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consultant own answers' })
  getMyAnswers(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.answersService.findByConsultant(req.user.id, {
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get answer by ID' })
  findOne(@Param('id') id: string) {
    return this.answersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update answer (only by consultant who created it)',
  })
  update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @Request() req: any,
  ) {
    return this.answersService.update(id, updateAnswerDto, req.user.id);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept answer as best answer (only by question owner)',
  })
  acceptAnswer(@Param('id') id: string, @Request() req: any) {
    return this.answersService.acceptAnswer(id, req.user.id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on answer (upvote/downvote)' })
  voteAnswer(
    @Param('id') id: string,
    @Body() body: { type: 'upvote' | 'downvote' },
    @Request() req: any,
  ) {
    return this.answersService.voteAnswer(id, body.type, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete answer' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.answersService.remove(id, req.user.id);
  }
}
