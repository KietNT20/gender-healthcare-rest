import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { QuestionStatusType } from 'src/enums';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
  @IsOptional()
  @IsEnum(QuestionStatusType)
  status?: QuestionStatusType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;
}
