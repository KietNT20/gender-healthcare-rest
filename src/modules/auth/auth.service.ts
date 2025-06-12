import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { HashingProvider } from './providers/hashing.provider';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
        private readonly hashingProvider: HashingProvider,
    ) {}

    async register(registerDto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(
            registerDto.email,
        );
        if (existingUser) {
            throw new BadRequestException('Email đã được sử dụng');
        }

        // Hash password
        const hashedPassword = await this.hashingProvider.hashPassword(
            registerDto.password,
        );

        // Generate verification token
        const emailVerificationToken = randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date();
        emailVerificationExpires.setHours(
            emailVerificationExpires.getHours() + 24,
        );

        // Generate slug for user
        const baseSlug = slugify(registerDto.fullName, {
            lower: true,
            strict: true,
        });
        const slug = `${baseSlug}-${uuidv4().substring(0, 8)}`;

        // Create user
        const userData = {
            ...registerDto,
            password: hashedPassword,
            slug,
            emailVerificationToken,
            emailVerificationExpires,
            roleId: await this.usersService.getCustomerRoleId(),
        };

        const user = await this.usersService.create(userData);

        // Send verification email
        try {
            await this.mailService.sendEmailVerification(
                user.email,
                emailVerificationToken,
                user.fullName,
            );
        } catch (error) {
            // Log error but don't fail registration
            console.error('Failed to send verification email:', error);
        }

        // Send welcome email
        try {
            await this.mailService.sendWelcomeEmail(user.email, user.fullName);
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }

        return {
            message:
                'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                emailVerified: user.emailVerified,
            },
        };
    }

    async login(loginDto: LoginDto) {
        // Find user by email
        const user = await this.usersService.findByEmailWithPassword(
            loginDto.email,
        );
        if (!user) {
            throw new UnauthorizedException('Tài khoản không tồn tại');
        }

        // Check if account is active
        if (!user.isActive) {
            throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
        }

        // Verify password
        const isPasswordValid = await this.hashingProvider.comparePassword(
            loginDto.password,
            user.password,
        );
        if (!isPasswordValid) {
            // Increment login attempts
            await this.usersService.incrementLoginAttempts(user.id);
            throw new UnauthorizedException(
                'Email hoặc mật khẩu không chính xác',
            );
        }

        // Reset login attempts on successful login
        await this.usersService.resetLoginAttempts(user.id);

        // Update last login
        await this.usersService.updateLastLogin(user.id);

        // Generate tokens
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
        });

        // Save refresh token
        await this.usersService.updateRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        };
    }

    async verifyEmail(token: string) {
        const user =
            await this.usersService.findByEmailVerificationToken(token);
        if (!user) {
            throw new BadRequestException('Token xác thực không hợp lệ');
        }

        if (
            user.emailVerificationExpires &&
            user.emailVerificationExpires < new Date()
        ) {
            throw new BadRequestException('Token xác thực đã hết hạn');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email đã được xác thực');
        }

        // Update user as verified
        await this.usersService.verifyEmail(user.id);

        return {
            message: 'Xác thực email thành công',
        };
    }

    async resendVerificationEmail(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new BadRequestException('Email không tồn tại');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email đã được xác thực');
        }

        // Generate new verification token
        const emailVerificationToken = randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date();
        emailVerificationExpires.setHours(
            emailVerificationExpires.getHours() + 24,
        );

        // Update user with new token
        await this.usersService.updateVerificationToken(
            user.id,
            emailVerificationToken,
            emailVerificationExpires,
        );

        // Send verification email
        await this.mailService.sendEmailVerification(
            user.email,
            emailVerificationToken,
            user.fullName,
        );

        return {
            message: 'Email xác thực đã được gửi lại',
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal that user doesn't exist
            return {
                message:
                    'Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu',
            };
        }

        // Generate password reset token
        const passwordResetToken = randomBytes(32).toString('hex');
        const passwordResetExpires = new Date();
        passwordResetExpires.setHours(passwordResetExpires.getHours() + 1); // 1 hour

        // Update user with reset token
        await this.usersService.updatePasswordResetToken(
            user.id,
            passwordResetToken,
            passwordResetExpires,
        );

        // Send password reset email
        try {
            await this.mailService.sendPasswordReset(
                user.email,
                passwordResetToken,
                user.fullName,
            );
        } catch (error) {
            console.error('Failed to send password reset email:', error);
        }

        return {
            message:
                'Nếu email tồn tại, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu',
        };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.findByPasswordResetToken(token);
        if (!user) {
            throw new BadRequestException(
                'Token đặt lại mật khẩu không hợp lệ',
            );
        }

        if (
            user.passwordResetExpires &&
            user.passwordResetExpires < new Date()
        ) {
            throw new BadRequestException('Token đặt lại mật khẩu đã hết hạn');
        }

        // Hash new password
        const hashedPassword =
            await this.hashingProvider.hashPassword(newPassword);

        // Update password and clear reset token
        await this.usersService.updatePassword(user.id, hashedPassword);

        return {
            message: 'Đặt lại mật khẩu thành công',
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            const user = await this.usersService.findByIdAndRefreshToken(
                payload.sub,
                refreshToken,
            );

            if (!user) {
                throw new UnauthorizedException('Refresh token không hợp lệ');
            }

            // Generate new access token
            const newPayload = { sub: user.id, email: user.email };
            const accessToken = this.jwtService.sign(newPayload);

            return {
                accessToken,
            };
        } catch (error) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }
    }

    async logout(userId: string) {
        // Clear refresh token
        await this.usersService.clearRefreshToken(userId);

        return {
            message: 'Đăng xuất thành công',
        };
    }

    async verifyToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.usersService.findOneById(payload.sub);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return {
                id: user.id,
                email: user.email,
                role: user.role?.name || 'user',
                fullName: user.fullName,
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async verifyTokenForWebSocket(token: string) {
        try {
            const cleanToken = token.replace('Bearer ', '');
            return await this.verifyToken(cleanToken);
        } catch (error) {
            return null;
        }
    }
}
