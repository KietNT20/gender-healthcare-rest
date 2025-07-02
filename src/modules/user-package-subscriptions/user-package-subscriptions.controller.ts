import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserPackageSubscriptionDto } from './dto/create-user-package-subscription.dto';
import { UpdateUserPackageSubscriptionDto } from './dto/update-user-package-subscription.dto';
import { UserPackageSubscriptionsService } from './user-package-subscriptions.service';

@ApiTags('User Package Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-package-subscriptions')
export class UserPackageSubscriptionsController {
    constructor(
        private readonly subscriptionsService: UserPackageSubscriptionsService,
    ) {}

    /**
     * Create a new user package subscription
     * @param createDto Data to create a subscription
     * @returns Created subscription
     */
    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Create a new user package subscription' })
    @ApiResponse({
        status: 201,
        description: 'User package subscription created successfully',
        type: CreateUserPackageSubscriptionDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Staff, Manager, or Admin can perform this action',
    })
    @ApiBody({ type: CreateUserPackageSubscriptionDto })
    @ResponseMessage('User package subscription created successfully')
    async create(@Body() createDto: CreateUserPackageSubscriptionDto) {
        return this.subscriptionsService.create(createDto);
    }

    /**
     * Get a list of all user package subscriptions
     * @returns List of subscriptions
     */
    @Get()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Get a list of all user package subscriptions' })
    @ApiResponse({
        status: 200,
        description: 'User package subscriptions retrieved successfully',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Staff, Manager, or Admin can perform this action',
    })
    @ResponseMessage('User package subscriptions retrieved successfully')
    async findAll() {
        return this.subscriptionsService.findAll();
    }

    /**
     * Get a user package subscription by ID
     * @param id Subscription ID
     * @returns Subscription details
     */
    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({ summary: 'Get a user package subscription by ID' })
    @ApiResponse({
        status: 200,
        description: 'User package subscription retrieved successfully',
        type: CreateUserPackageSubscriptionDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid subscription ID format' })
    @ApiResponse({
        status: 404,
        description: 'User package subscription not found',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Customer, Staff, Manager, or Admin can perform this action',
    })
    @ApiParam({ name: 'id', description: 'Subscription ID', type: String })
    @ResponseMessage('User package subscription retrieved successfully')
    async findOne(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid subscription ID'),
            }),
        )
        id: string,
    ) {
        return this.subscriptionsService.findOne(id);
    }

    /**
     * Update a user package subscription by ID
     * @param id Subscription ID
     * @param updateDto Data to update the subscription
     * @returns Updated subscription
     */
    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Update a user package subscription by ID' })
    @ApiResponse({
        status: 200,
        description: 'User package subscription updated successfully',
        type: UpdateUserPackageSubscriptionDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid subscription ID format' })
    @ApiResponse({
        status: 404,
        description: 'User package subscription not found',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Staff, Manager, or Admin can perform this action',
    })
    @ApiParam({ name: 'id', description: 'Subscription ID', type: String })
    @ApiBody({ type: UpdateUserPackageSubscriptionDto })
    @ResponseMessage('User package subscription updated successfully')
    async update(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid subscription ID'),
            }),
        )
        id: string,
        @Body() updateDto: UpdateUserPackageSubscriptionDto,
    ) {
        return this.subscriptionsService.update(id, updateDto);
    }

    /**
     * Soft delete a user package subscription by ID
     * @param id Subscription ID
     * @returns Success message
     */
    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Soft delete a user package subscription by ID' })
    @ApiResponse({
        status: 200,
        description: 'User package subscription deleted successfully',
    })
    @ApiResponse({ status: 400, description: 'Invalid subscription ID format' })
    @ApiResponse({
        status: 404,
        description: 'User package subscription not found',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden: Only Admin can perform this action',
    })
    @ApiParam({ name: 'id', description: 'Subscription ID', type: String })
    @ResponseMessage('User package subscription deleted successfully')
    async remove(
        @Param(
            'id',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid subscription ID'),
            }),
        )
        id: string,
    ) {
        await this.subscriptionsService.remove(id);
        return { message: 'User package subscription deleted successfully' };
    }

    /**
     * Get subscription status for a user
     * @param userId User ID
     * @returns Subscription status
     */
    @Get('status/:userId')
    @UseGuards(RoleGuard)
    @Roles([
        RolesNameEnum.CUSTOMER,
        RolesNameEnum.STAFF,
        RolesNameEnum.MANAGER,
        RolesNameEnum.ADMIN,
    ])
    @ApiOperation({ summary: 'Get subscription status for a user' })
    @ApiResponse({
        status: 200,
        description: 'User package subscription status retrieved successfully',
    })
    @ApiResponse({ status: 400, description: 'Invalid user ID format' })
    @ApiResponse({
        status: 404,
        description: 'User not found or no active subscription',
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Only Customer, Staff, Manager, or Admin can perform this action',
    })
    @ApiParam({ name: 'userId', description: 'User ID', type: String })
    @ResponseMessage('User package subscription status retrieved successfully')
    async getStatus(
        @Param(
            'userId',
            new ParseUUIDPipe({
                exceptionFactory: () =>
                    new BadRequestException('Invalid user ID'),
            }),
        )
        userId: string,
    ) {
        return this.subscriptionsService.checkSubscriptionStatus(userId);
    }
}
