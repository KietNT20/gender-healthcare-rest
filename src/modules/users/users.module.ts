import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcryptProvider } from '../auth/providers/bcrypt.provider';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { MailModule } from '../mail/mail.module';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import { CreateGoogleUserProvider } from './provider/create-google-user.provider';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role]), MailModule],
    controllers: [UsersController],
    providers: [
        UsersService,
        CreateGoogleUserProvider,
        {
            provide: HashingProvider,
            useClass: BcryptProvider,
        },
    ],
    exports: [UsersService, CreateGoogleUserProvider],
})
export class UsersModule {}
