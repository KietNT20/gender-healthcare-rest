import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
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
        status: 201,
        description: 'User registered successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Email already exists or validation failed',
    })
    @ResponseMessage('User registered successfully')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user and get access tokens' })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid credentials or account locked',
    })
    @ResponseMessage('Login successful')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('verify-email')
    @ApiOperation({ summary: 'Verify user email with token' })
    @ApiQuery({
        name: 'token',
        description: 'Email verification token',
        type: String,
    })
    @ApiResponse({
        status: 200,
        description: 'Email verified successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid or expired verification token',
    })
    @ResponseMessage('Email verified successfully')
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('resend-verification')
    @ApiOperation({ summary: 'Resend email verification' })
    @ApiResponse({
        status: 200,
        description: 'Verification email sent',
    })
    @ApiResponse({
        status: 400,
        description: 'Email already verified or not found',
    })
    @ResponseMessage('Verification email sent')
    async resendVerification(
        @Body() resendVerificationDto: ResendVerificationDto,
    ) {
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
        status: 200,
        description: 'Password reset email sent (or message for security)',
    })
    @ResponseMessage('Password reset instructions sent')
    async forgotPassword(@Body('email') email: string) {
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
        status: 200,
        description: 'Password reset successful',
    })
    @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
    @ResponseMessage('Password reset successful')
    async resetPassword(
        @Param('token') token: string,
        @Body() resetPasswordDto: ResetPasswordDto,
    ) {
        return this.authService.resetPassword(token, resetPasswordDto.password);
    }

    @Post('refresh-token')
    @UseGuards(RefreshJwtGuard)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({
        status: 200,
        description: 'Token refreshed successfully',
    })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    @ResponseMessage('Token refreshed successfully')
    async refreshToken(@CurrentUser() user: RefreshTokenDto) {
        return this.authService.refreshToken(user.refreshToken);
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
    @ApiResponse({
        status: 200,
        description: 'Logout successful',
    })
    @ResponseMessage('Logout successful')
    async logout(@CurrentUser() user: User) {
        return this.authService.logout(user.id);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
    })
    @ApiResponse({ status: 401, description: 'User not authenticated' })
    @ResponseMessage('User profile retrieved')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getProfile(@CurrentUser() user: User) {
        // Return user without sensitive information
        const { password, refreshToken, ...userProfile } = user;
        return userProfile;
    }
}
