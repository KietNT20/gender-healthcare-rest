import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { ChatCleanupSchedulerService } from './chat-cleanup-scheduler.service';
import { ChatCleanupService } from './chat-cleanup.service';
import { ChatRoomCleanupService } from './chat-room-cleanup.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatPaymentGuard } from './core/guards/chat-payment.guard';
import { WsAuthGuard } from './core/guards/ws-auth.guard';
import { WsRoomAccessGuard } from './core/guards/ws-room-access.guard';
import { WsThrottleGuard } from './core/guards/ws-throttle.guard';
import { ChatCoreService } from './core/services/chat-core.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';
import {
    ConnectionHandler,
    MessageHandler,
    RoomHandler,
    TypingHandler,
} from './handlers';
import { RedisService } from './infrastructure/redis/redis.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Message, Question]),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRATION_TIME'),
                },
            }),
            inject: [ConfigService],
        }),
        FilesModule,
        AuthModule,
    ],
    controllers: [ChatController],
    providers: [
        ChatCoreService,
        RedisService,
        ChatService,
        ChatCleanupService,
        ChatCleanupSchedulerService,
        ChatGateway,
        ConnectionHandler,
        RoomHandler,
        MessageHandler,
        TypingHandler,
        WsAuthGuard,
        WsRoomAccessGuard,
        WsThrottleGuard,
        ChatPaymentGuard,
        ChatRoomCleanupService,
        {
            provide: 'REDIS_CLIENT',
            useFactory: (redisService: RedisService) =>
                redisService.getClient(),
            inject: [RedisService],
        },
    ],
    exports: [
        ChatCoreService,
        ChatGateway,
        RedisService,
        ChatService,
        ChatCleanupService,
        ChatCleanupSchedulerService,
        ChatRoomCleanupService,
    ],
})
export class ChatModule {}
