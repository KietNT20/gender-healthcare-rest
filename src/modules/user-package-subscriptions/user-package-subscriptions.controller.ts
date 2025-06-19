import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Roles } from "src/decorators/roles.decorator";
import { RolesNameEnum } from "src/enums";
import { RoleGuard } from "src/guards/role.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserPackageSubscriptionsService } from "./user-package-subscriptions.service";
import { CreateUserPackageSubscriptionDto } from "./dto/create-user-package-subscription.dto";
import { UpdateUserPackageSubscriptionDto } from "./dto/update-user-package-subscription.dto";

// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('user-package-subscriptions')
export class UserPackageSubscriptionsController {
  constructor(private readonly subscriptionsService: UserPackageSubscriptionsService) {}

  @Post()
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async create(@Body() createDto: CreateUserPackageSubscriptionDto) {
    return this.subscriptionsService.create(createDto);
  }

  @Get()
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserPackageSubscriptionDto) {
    return this.subscriptionsService.update(id, updateDto);
  }

  @Delete(':id')
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.ADMIN])
  async remove(@Param('id') id: string) {
    await this.subscriptionsService.remove(id);
    return { message: 'Subscription deleted successfully' };
  }

  @Get('status/:userId')
//   @UseGuards(RoleGuard)
//   @Roles([RolesNameEnum.CUSTOMER, RolesNameEnum.STAFF, RolesNameEnum.MANAGER, RolesNameEnum.ADMIN])
  async getStatus(@Param('userId') userId: string) {
    return this.subscriptionsService.checkSubscriptionStatus(userId);
  }
}