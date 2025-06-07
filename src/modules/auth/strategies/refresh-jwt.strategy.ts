import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenDto } from '../dto/refresh-toekn.dto';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') as string,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenDto) {
    const authHeader = req.get('authorization');

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const refreshToken = authHeader.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return { ...payload, refreshToken };
  }
}
