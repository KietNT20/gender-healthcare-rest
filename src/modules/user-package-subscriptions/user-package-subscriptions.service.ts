import { Injectable } from '@nestjs/common';
import { CreateUserPackageSubscriptionDto } from './dto/create-user-package-subscription.dto';
import { UpdateUserPackageSubscriptionDto } from './dto/update-user-package-subscription.dto';

@Injectable()
export class UserPackageSubscriptionsService {
    create(createUserPackageSubscriptionDto: CreateUserPackageSubscriptionDto) {
        return 'This action adds a new userPackageSubscription';
    }

    findAll() {
        return `This action returns all userPackageSubscriptions`;
    }

    findOne(id: number) {
        return `This action returns a #${id} userPackageSubscription`;
    }

    update(
        id: number,
        updateUserPackageSubscriptionDto: UpdateUserPackageSubscriptionDto,
    ) {
        return `This action updates a #${id} userPackageSubscription`;
    }

    remove(id: number) {
        return `This action removes a #${id} userPackageSubscription`;
    }
}
