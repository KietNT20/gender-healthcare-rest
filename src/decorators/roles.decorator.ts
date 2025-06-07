import { RolesNameEnum } from '@enums/index';
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<RolesNameEnum[]>();
