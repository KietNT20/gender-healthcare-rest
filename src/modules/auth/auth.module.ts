import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RoleGuard } from 'src/guards/role.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import googleAuthConfig from './config/google-auth.config';
import { GoogleAuthenticationController } from './google-authentication/google-authentication.controller';
import { GoogleAuthenticationService } from './google-authentication/google-authentication.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { BcryptProvider } from './providers/bcrypt.provider';
import { HashingProvider } from './providers/hashing.provider';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';

@Module({
    imports: [
        ConfigModule.forFeature(googleAuthConfig),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRATION_TIME'),
                },
            }),
            inject: [ConfigService],
        }),
        UsersModule,
        MailModule,
        AuditLogsModule,
    ],
    providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        RefreshJwtStrategy,
        JwtAuthGuard,
        LocalAuthGuard,
        RoleGuard,
        {
            provide: HashingProvider,
            useClass: BcryptProvider,
        },
        GoogleAuthenticationService,
    ],
    controllers: [AuthController, GoogleAuthenticationController],
    exports: [
        AuthService,
        JwtAuthGuard,
        RoleGuard,
        LocalAuthGuard,
        HashingProvider,
    ],
})
export class AuthModule {}
