import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-toekn.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user account' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User registered successfully',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Email validation failed',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email already exists',
    })
    @ResponseMessage('User registered successfully')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user and get access tokens' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Login successful',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials or account locked',
    })
    @ResponseMessage('Login successful')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('verify-email')
    @ApiOperation({
        summary: 'Verify user email with token and redirect to frontend',
    })
    @ApiQuery({
        name: 'token',
        description: 'Email verification token',
        type: String,
    })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Email verified successfully, redirecting to frontend',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid or expired verification token',
    })
    async verifyEmail(@Query('token') token: string, @Res() res: Response) {
        try {
            await this.authService.verifyEmail(token);
            const frontendUrl =
                process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(
                `${frontendUrl}/auth/verify-success?message=Email verified successfully`,
            );
        } catch (error) {
            const frontendUrl =
                process.env.FRONTEND_URL || 'http://localhost:3000';
            const errorMessage = encodeURIComponent(
                error.message || 'Email verification failed',
            );
            return res.redirect(
                `${frontendUrl}/auth/verify-error?message=${errorMessage}`,
            );
        }
    }

    @Post('resend-verification')
    @ApiOperation({ summary: 'Resend email verification' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Verification email sent',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Email not found',
    })
    @ResponseMessage('Verification email sent')
    resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
        return this.authService.resendVerificationEmail(
            resendVerificationDto.email,
        );
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                },
            },
            required: ['email'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Password reset email sent (or message for security)',
    })
    @ResponseMessage('Password reset instructions sent')
    forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Put('reset-password/:token')
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiParam({
        name: 'token',
        description: 'Password reset token',
        type: String,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Password reset successful',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid or expired reset token',
    })
    @ResponseMessage('Password reset successful')
    resetPassword(
        @Param('token') token: string,
        @Body() resetPasswordDto: ResetPasswordDto,
    ) {
        return this.authService.resetPassword(token, resetPasswordDto.password);
    }

    @Get('reset-password')
    @ApiOperation({
        summary:
            'Handle password reset link from email and redirect to frontend',
    })
    @ApiQuery({
        name: 'token',
        description: 'Password reset token',
        type: String,
    })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Redirecting to frontend password reset page',
    })
    async handlePasswordResetRedirect(
        @Query('token') token: string,
        @Res() res: Response,
    ) {
        try {
            // Validate token (không reset password, chỉ validate)
            await this.authService.validateResetToken(token);

            // Chuyển hướng đến frontend với token hợp lệ
            const frontendUrl =
                process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(
                `${frontendUrl}/auth/reset-password?token=${token}`,
            );
        } catch (error) {
            // Chuyển hướng đến frontend với thông báo lỗi
            const frontendUrl =
                process.env.FRONTEND_URL || 'http://localhost:3000';
            const errorMessage = encodeURIComponent(
                error.message || 'Invalid or expired reset token',
            );
            return res.redirect(
                `${frontendUrl}/auth/reset-error?message=${errorMessage}`,
            );
        }
    }

    @Post('refresh-token')
    @UseGuards(RefreshJwtGuard)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Token refreshed successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid refresh token',
    })
    @ResponseMessage('Token refreshed successfully')
    async refreshToken(@Body() body: RefreshTokenDto) {
        return this.authService.refreshToken(body.refreshToken);
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Logout successful',
    })
    @ResponseMessage('Logout successful')
    async logout(@CurrentUser() user: User) {
        return this.authService.logout(user.id);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'User not authenticated',
    })
    @ResponseMessage('User profile retrieved')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getProfile(@CurrentUser() user: User) {
        // Return user without sensitive information
        const { password, refreshToken, ...userProfile } = user;
        return userProfile;
    }
}
