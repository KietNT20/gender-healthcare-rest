import {
    forwardRef,
    Inject,
    Injectable,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from 'src/modules/users/entities/user.entity';
import { GoogleUser } from 'src/modules/users/interfaces/google-user.interface';
import { CreateGoogleUserProvider } from 'src/modules/users/provider/create-google-user.provider';
import { UsersService } from 'src/modules/users/users.service';
import googleAuthConfig from '../config/google-auth.config';
import { GoogleTokenDto } from './dto/google-token.dto';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
    private oauthClient: OAuth2Client;

    constructor(
        @Inject(googleAuthConfig.KEY)
        private readonly oauthGoogleConfiguration: ConfigType<
            typeof googleAuthConfig
        >,
        @Inject(forwardRef(() => UsersService))
        private readonly userService: UsersService,
        private readonly createGoogleUserProvider: CreateGoogleUserProvider,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        const clientId = this.oauthGoogleConfiguration.clientId;
        const clientSecret = this.oauthGoogleConfiguration.clientSecret;
        this.oauthClient = new OAuth2Client(clientId, clientSecret);
    }

    public async authenticate(googleTokenDto: GoogleTokenDto) {
        // Verify Google token
        const loginTicket = await this.oauthClient.verifyIdToken({
            idToken: googleTokenDto.token,
        });

        const payload = loginTicket.getPayload();
        if (!payload) {
            throw new UnauthorizedException('Invalid token payload');
        }

        const {
            email,
            sub: googleId,
            given_name,
            family_name,
            picture,
        } = payload;

        if (!email) {
            throw new UnauthorizedException('Email not found in Google token');
        }

        if (!given_name) {
            throw new UnauthorizedException('Name not found in Google token');
        }

        if (!family_name) {
            throw new UnauthorizedException(
                'Family name not found in Google token',
            );
        }

        const googleUser: GoogleUser = {
            email: email.toLowerCase(),
            googleId,
            firstName: given_name,
            lastName: family_name,
            profilePicture: picture,
        };

        // Check if user already exists
        let user = await this.createGoogleUserProvider.findExistingGoogleUser(
            googleId,
            email,
        );

        if (user) {
            if (!user.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }

            // If user has email but no googleId, link Google account
            if (!user.googleId && user.email === googleUser.email) {
                user = await this.createGoogleUserProvider.linkGoogleAccount(
                    user.id,
                    googleId,
                    picture,
                );
            }

            await this.userService.updateLastLogin(user.id);

            return this.generateTokens(user);
        }

        const newUser =
            await this.createGoogleUserProvider.createGoogleUser(googleUser);

        await this.userService.updateLastLogin(newUser.id);

        return this.generateTokens(newUser);
    }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
        });

        // Save refresh token
        await this.userService.updateRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: `${user.firstName} ${user.lastName}`,
                role: user.role,
                emailVerified: user.emailVerified,
                profilePicture: user.profilePicture,
            },
        };
    }
}
