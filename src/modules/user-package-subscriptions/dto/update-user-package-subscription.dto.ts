import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPackageSubscriptionDto } from './create-user-package-subscription.dto';

export class UpdateUserPackageSubscriptionDto extends PartialType(CreateUserPackageSubscriptionDto) {}
