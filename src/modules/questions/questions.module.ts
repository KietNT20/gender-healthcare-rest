import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Question } from './entities/question.entity';
import { QuestionsConsultingGateway } from './questions-consulting.gateway';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
    imports: [TypeOrmModule.forFeature([Question]), AuthModule],
    controllers: [QuestionsController],
    providers: [QuestionsService, QuestionsConsultingGateway],
    exports: [QuestionsService, QuestionsConsultingGateway],
})
export class QuestionsModule {}
