import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
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
    ) {}

    onModuleInit() {
        const clientId = this.oauthGoogleConfiguration.clientId;
        const clientSecret = this.oauthGoogleConfiguration.clientSecret;
        this.oauthClient = new OAuth2Client(clientId, clientSecret);
    }

    public async authentication(googleTokenDto: GoogleTokenDto) {
        // verify the Google token sent by the client
        // extract the payload from Google JWT
        // Find the user in the database by googleId
        // If googleId exists, generate tokens
        // If not create a new user and then generate tokens
        // throw UnauthorizedException
    }
}
