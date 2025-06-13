import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GoogleTokenDto } from './dto/google-token.dto';
import { GoogleAuthenticationService } from './google-authentication.service';

@ApiTags('Authentication')
@Controller('auth/google')
export class GoogleAuthenticationController {
    constructor(
        private readonly googleAuthenticationService: GoogleAuthenticationService,
    ) {}

    @Post('authenticate')
    @ApiOperation({ summary: 'Authenticate with Google token' })
    @ApiResponse({ status: 200, description: 'Authentication successful' })
    @ApiResponse({ status: 401, description: 'Authentication failed' })
    async authenticate(@Body() googleTokenDto: GoogleTokenDto) {
        return this.googleAuthenticationService.authenticate(googleTokenDto);
    }
}
