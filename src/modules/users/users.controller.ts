import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateManyUsersDto } from './dto/create-many-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/query-user.dto';
import { UpdateHealthDataConsentDto } from './dto/update-health-data-consent.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User created successfully',
    })
    @ResponseMessage('User created successfully')
    create(@Body() createUserDto: CreateUserDto, @CurrentUser() actor?: User) {
        return this.usersService.create(createUserDto, actor?.id);
    }

    @Post('bulk')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Create multiple users' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Users created successfully',
    })
    @ResponseMessage('Users created successfully')
    createMany(@Body() createManyUsersDto: CreateManyUsersDto) {
        return this.usersService.createMany(createManyUsersDto);
    }

    @Get()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get all users with pagination and filters' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Users retrieved successfully',
    })
    @ResponseMessage('Users retrieved successfully')
    findAll(@Query() userQueryDto: UserQueryDto) {
        return this.usersService.findAll(userQueryDto);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Current user profile retrieved successfully',
    })
    @ResponseMessage('Current user profile retrieved successfully')
    getProfile(@CurrentUser() user: User) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật thông tin cá nhân thành công',
    })
    @ResponseMessage('Cập nhật thông tin cá nhân thành công')
    updateProfile(
        @CurrentUser() user: User,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, updateProfileDto);
    }

    @Put('me/change-password')
    @ApiOperation({ summary: 'Change current user password' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật mật khẩu thành công',
    })
    @ResponseMessage('Cập nhật mật khẩu thành công')
    changePassword(
        @CurrentUser() user: User,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(user.id, changePasswordDto);
    }

    @Patch('me/health-data-consent')
    @ApiOperation({
        summary: 'Update health data consent',
        description:
            'Cập nhật trạng thái đồng ý cho việc thu thập dữ liệu sức khỏe',
    })
    @ApiOkResponse({
        description: 'Cập nhật trạng thái đồng ý thành công',
    })
    @ResponseMessage('Cập nhật trạng thái đồng ý thành công')
    updateHealthDataConsent(
        @CurrentUser() user: User,
        @Body() updateConsentDto: UpdateHealthDataConsentDto,
    ) {
        return this.usersService.updateHealthDataConsent(
            user.id,
            updateConsentDto.healthDataConsent,
        );
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get user by slug' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully',
    })
    @ResponseMessage('User retrieved successfully')
    findBySlug(@Param('slug') slug: string) {
        return this.usersService.findBySlug(slug);
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized access',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description:
            'Forbidden access to this resource (only Admin/Manager/Staff can access)',
    })
    @ResponseMessage('User retrieved successfully')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Update user by ID (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User updated successfully',
    })
    @ResponseMessage('User updated successfully')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() actor?: User,
    ) {
        return this.usersService.update(id, updateUserDto, actor?.id);
    }

    @Put(':id/toggle-active')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Toggle user active status (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User status updated successfully',
    })
    @ResponseMessage('User status updated successfully')
    toggleActive(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.toggleActive(id);
    }

    @Put(':id/verify-email')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Verify user email (Admin/Manager only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email verified successfully',
    })
    @ResponseMessage('Email verified successfully')
    async verifyEmail(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<{ message: string }> {
        await this.usersService.verifyEmail(id);
        return { message: 'Email verified successfully' };
    }

    @Delete(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN])
    @ApiOperation({ summary: 'Soft delete user (Admin only)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User deleted successfully',
    })
    @ResponseMessage('User deleted successfully')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<{ message: string }> {
        await this.usersService.remove(id, currentUser.id);
        return { message: 'User deleted successfully' };
    }
}