import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message, Question, User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
                },
            }),
            inject: [ConfigService],
        }),
        forwardRef(() => AuthModule),
        FilesModule,
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatGateway, ChatService],
})
export class ChatModule {}
