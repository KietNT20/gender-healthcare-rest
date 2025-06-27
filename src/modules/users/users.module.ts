import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { BcryptProvider } from '../auth/providers/bcrypt.provider';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { MailModule } from '../mail/mail.module';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import { CreateGoogleUserProvider } from './provider/create-google-user.provider';
import { UserDashboardController } from './user-dashboard.controller';
import { UserDashboardService } from './user-dashboard.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role]),
        MailModule,
        AuditLogsModule,
    ],
    controllers: [UsersController, UserDashboardController],
    providers: [
        UsersService,
        UserDashboardService,
        CreateGoogleUserProvider,
        {
            provide: HashingProvider,
            useClass: BcryptProvider,
        },
    ],
    exports: [UsersService, UserDashboardService, CreateGoogleUserProvider],
})
export class UsersModule {}
