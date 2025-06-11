import { Reflector } from '@nestjs/core';
import { RolesNameEnum } from 'src/enums';

export const Roles = Reflector.createDecorator<RolesNameEnum[]>();
