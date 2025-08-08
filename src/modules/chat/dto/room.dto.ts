import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinRoomDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;
}

export class LeaveRoomDto {
    @IsUUID()
    @IsNotEmpty()
    questionId: string;
}
