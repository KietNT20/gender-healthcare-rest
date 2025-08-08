import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { User } from '../users/entities/user.entity';
import { ChatCoreService } from './core/services/chat-core.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';
import { ChatGateway } from './gateway/chat.gateway';
import { RedisService } from './infrastructure/redis/redis.service';

// Gateway Handlers
import {
    ConnectionHandler,
    MessageHandler,
    RoomHandler,
    TypingHandler,
} from './gateway/handlers';

// Guards
import { ChatCleanupSchedulerService } from './chat-cleanup-scheduler.service';
import { ChatCleanupService } from './chat-cleanup.service';
import { WsAuthGuard } from './core/guards/ws-auth.guard';
import { WsRoomAccessGuard } from './core/guards/ws-room-access.guard';
import { WsThrottleGuard } from './core/guards/ws-throttle.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Message, Question]),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
            inject: [ConfigService],
        }),
        FilesModule,
        AuthModule,
    ],
    controllers: [],
    providers: [
        ChatCoreService,
        RedisService,
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
    ],
    exports: [
        ChatCoreService,
        ChatGateway,
        RedisService,
        ChatCleanupService,
        ChatCleanupSchedulerService,
    ],
})
export class ChatModule {}
