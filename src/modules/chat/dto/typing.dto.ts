import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class TypingDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;

    @IsBoolean()
    @IsNotEmpty()
    isTyping: boolean;
}
