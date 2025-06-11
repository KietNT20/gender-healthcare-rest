import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
    ChangePasswordDto,
    UpdateProfileDto,
    UserResponseDto,
} from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ResponseMessage('User created successfully')
    create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get all users with pagination and filters' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ResponseMessage('Users retrieved successfully')
    findAll(
        @Query() userQueryDto: UserQueryDto,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.usersService.findAll({
            ...userQueryDto,
            page,
            limit,
        });
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Current user profile retrieved successfully',
    })
    @ResponseMessage('Current user profile retrieved successfully')
    getProfile(@CurrentUser() user: User) {
        return this.usersService.findOne(user.id);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get user by slug' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ResponseMessage('User retrieved successfully')
    findBySlug(@Param('slug') slug: string): Promise<UserResponseDto> {
        return this.usersService.findBySlug(slug);
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER, RolesNameEnum.STAFF])
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ResponseMessage('User retrieved successfully')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
        return this.usersService.findOne(id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ResponseMessage('Profile updated successfully')
    updateProfile(
        @CurrentUser() user: User,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserResponseDto> {
        return this.usersService.updateProfile(user.id, updateProfileDto);
    }

    @Put('me/change-password')
    @ApiOperation({ summary: 'Change current user password' })
    @ApiResponse({ status: 200, description: 'Password changed successfully' })
    @ResponseMessage('Password changed successfully')
    async changePassword(
        @CurrentUser() user: User,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        await this.usersService.changePassword(user.id, changePasswordDto);
        return { message: 'Password changed successfully' };
    }

    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Update user by ID (Admin/Manager only)' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ResponseMessage('User updated successfully')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.update(id, updateUserDto);
    }

    @Put(':id/toggle-active')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Toggle user active status (Admin/Manager only)' })
    @ApiResponse({
        status: 200,
        description: 'User status updated successfully',
    })
    @ResponseMessage('User status updated successfully')
    toggleActive(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<UserResponseDto> {
        return this.usersService.toggleActive(id);
    }

    @Put(':id/verify-email')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
    @ApiOperation({ summary: 'Verify user email (Admin/Manager only)' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
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
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ResponseMessage('User deleted successfully')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() currentUser: User,
    ): Promise<{ message: string }> {
        await this.usersService.remove(id);
        return { message: 'User deleted successfully' };
    }
}
