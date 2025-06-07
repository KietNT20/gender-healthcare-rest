import { UsersService } from '@modules/users/users.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    // Passport sẽ tự động xác thực token.
    // Dữ liệu trả về ở đây sẽ được gán vào request.user
    const user = await this.usersService.findOneById(payload.sub);
    // Bạn có thể thêm các thông tin khác vào user object nếu cần
    return user;
  }
}
