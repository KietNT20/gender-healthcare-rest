import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';
import { CreateUserPackageSubscriptionDto } from './dto/create-user-package-subscription.dto';
import { UpdateUserPackageSubscriptionDto } from './dto/update-user-package-subscription.dto';

@Controller('user-package-subscriptions')
export class UserPackageSubscriptionsController {
    constructor(
        private readonly userPackageSubscriptionsService: UserPackageSubscriptionsService,
    ) {}

    @Post()
    create(
        @Body()
        createUserPackageSubscriptionDto: CreateUserPackageSubscriptionDto,
    ) {
        return this.userPackageSubscriptionsService.create(
            createUserPackageSubscriptionDto,
        );
    }

    @Get()
    findAll() {
        return this.userPackageSubscriptionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.userPackageSubscriptionsService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body()
        updateUserPackageSubscriptionDto: UpdateUserPackageSubscriptionDto,
    ) {
        return this.userPackageSubscriptionsService.update(
            +id,
            updateUserPackageSubscriptionDto,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.userPackageSubscriptionsService.remove(+id);
    }
}
