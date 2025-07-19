import { RolesNameEnum } from 'src/enums';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    role: RolesNameEnum;
    iat?: number;
    exp?: number;
}
