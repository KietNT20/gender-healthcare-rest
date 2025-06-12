import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedbackDto } from './create-feedback.dto';
import { IsInt, IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {
    @IsOptional()
    @IsInt()
    rating?: number;
  
    @IsOptional()
    @IsString()
    comment?: string;
  
    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
  
    @IsOptional()
    @IsString()
    staffResponse?: string;
  
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categories?: string[];
  }
