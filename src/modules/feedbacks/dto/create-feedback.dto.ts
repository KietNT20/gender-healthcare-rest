// src/modules/feedbacks/dto/create-feedback.dto.ts
import {
    IsUUID,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsString,
    IsBoolean,
    IsArray,
  } from 'class-validator';
  
  export class CreateFeedbackDto {
    @IsOptional()
    @IsUUID()
    userId?: string;
  
    @IsOptional()
    @IsUUID()
    serviceId?: string;
  
    @IsOptional()
    @IsUUID()
    appointmentId?: string;
  
    @IsOptional()
    @IsUUID()
    consultantId?: string;
  
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
  
    @IsOptional()
    @IsString()
    comment?: string;
  
    @IsOptional()
    @IsBoolean()
    isAnonymous?: boolean;
  
    @IsOptional()
    @IsString()
    staffResponse?: string;
  }
  