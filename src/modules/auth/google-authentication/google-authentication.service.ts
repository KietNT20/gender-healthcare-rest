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
import slugify from 'slugify';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { v4 as uuidv4 } from 'uuid';
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
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    onModuleInit() {
        const clientId = this.oauthGoogleConfiguration.clientId;
        const clientSecret = this.oauthGoogleConfiguration.clientSecret;
        this.oauthClient = new OAuth2Client(clientId, clientSecret);
    }
    public async authenticate(googleTokenDto: GoogleTokenDto) {
        // verify the Google token sent by the client
        const loginTicket = await this.oauthClient.verifyIdToken({
            idToken: googleTokenDto.token,
        });

        // extract the payload from Google JWT
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

        // Find the user in the database by googleId
        let user = await this.userService.findOneByGoogleId(googleId);
        if (user) {
            // User exists with googleId, check if account is active
            if (!user.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }

            // Update last login
            await this.userService.updateLastLogin(user.id);

            // Generate tokens and return
            return this.generateTokens(user);
        }

        // Check if user exists with the same email but no googleId
        const existingUser = await this.userService.findByEmail(email);

        if (existingUser) {
            // User exists with email but no googleId, update their record
            await this.userService.updateGoogleProfile(
                existingUser.id,
                googleId,
                picture || existingUser.profilePicture,
            );

            // Get updated user
            user = await this.userService.findOneById(existingUser.id);

            if (!user?.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }

            // Update last login
            await this.userService.updateLastLogin(user.id);

            // Generate tokens and return
            return this.generateTokens(user);
        }

        // Create new user
        const customerRoleId = await this.userService.getCustomerRoleId();

        // Generate unique slug
        const userSlug = `${given_name || 'User'} ${family_name || 'Google'} ${email}`;
        const baseSlug = slugify(userSlug, {
            lower: true,
            strict: true,
        });
        const slug = `${baseSlug}-${uuidv4().substring(0, 8)}`;

        const userData = {
            firstName: given_name || 'User',
            lastName: family_name || 'Google',
            email: email.toLowerCase(),
            password: 'google_auth_' + uuidv4(),
            googleId,
            slug,
            roleId: customerRoleId,
            profilePicture: picture,
            emailVerified: true,
            isActive: true,
            locale: 'vi',
        };

        const newUser = await this.userService.create(userData);

        // Update last login
        await this.userService.updateLastLogin(newUser.id);

        // Get full user with relations
        user = await this.userService.findOneById(newUser.id);

        if (!user) {
            throw new UnauthorizedException('Failed to create user');
        }

        // Generate tokens and return
        return this.generateTokens(user);
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
                fullName: user.firstName + ' ' + user.lastName,
                role: user.role,
                emailVerified: user.emailVerified,
                profilePicture: user.profilePicture,
            },
        };
    }
}
