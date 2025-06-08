import { RolesNameEnum } from '@enums/index';
import { Role } from '@modules/roles/entities/role.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import slugify from 'slugify';
import { IsNull, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Generate unique slug
    const baseSlug = slugify(createUserDto.fullName, {
      lower: true,
      strict: true,
    });
    const slug = await this.generateUniqueSlug(baseSlug);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      slug,
      dateOfBirth: createUserDto.dateOfBirth
        ? new Date(createUserDto.dateOfBirth)
        : undefined,
    });

    const savedUser = await this.userRepository.save(user);

    // Return user without password
    return this.toUserResponse(savedUser);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    roleId?: string,
    isActive?: boolean,
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deletedAt IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by creation date
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => this.toUserResponse(user)),
      total,
      totalPages,
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['role'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
      relations: ['role'],
    });
  }

  // Auth-related methods
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase(), deletedAt: IsNull() },
      relations: ['role'],
      select: [
        'id',
        'email',
        'password',
        'fullName',
        'isActive',
        'emailVerified',
        'accountLockedUntil',
        'loginAttempts',
      ],
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
        deletedAt: IsNull(),
      },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        passwordResetToken: token,
        deletedAt: IsNull(),
      },
    });
  }

  async findByIdAndRefreshToken(
    id: string,
    refreshToken: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['role'],
      select: ['id', 'email', 'fullName', 'isActive', 'refreshToken'],
    });

    if (!user || !user.refreshToken) {
      return null;
    }

    // Compare the provided refresh token with the hashed one in database
    const isValidRefreshToken = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    return isValidRefreshToken ? user : null;
  }

  async getCustomerRoleId(): Promise<string> {
    const customerRole = await this.roleRepository.findOne({
      where: { name: RolesNameEnum.CUSTOMER },
    });

    if (!customerRole) {
      throw new NotFoundException('Customer role not found');
    }

    return customerRole.id;
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    const updateData: Partial<User> = {
      loginAttempts: newAttempts,
      updatedAt: new Date(),
    };

    // Lock account after 5 failed attempts for 30 minutes
    if (newAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      updateData.accountLockedUntil = lockUntil;
    }

    await this.userRepository.update(id, updateData);
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.userRepository.update(id, {
      loginAttempts: 0,
      accountLockedUntil: undefined,
      updatedAt: new Date(),
    });
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    // Hash the refresh token before storing
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.userRepository.update(id, {
      refreshToken: hashedRefreshToken,
      updatedAt: new Date(),
    });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      refreshToken: undefined,
      updatedAt: new Date(),
    });
  }

  async updateVerificationToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      updatedAt: new Date(),
    });
  }

  async updatePasswordResetToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      updatedAt: new Date(),
    });
  }

  async findBySlug(slug: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { slug, deletedAt: IsNull() },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }

    const { dateOfBirth, fullName, ...restOfDto } = updateUserDto;
    const payload: Partial<User> = { ...restOfDto };

    // Update slug if fullName is being updated
    if (fullName && fullName !== user.fullName) {
      const baseSlug = slugify(fullName, { lower: true, strict: true });
      payload.slug = await this.generateUniqueSlug(baseSlug, id);
      payload.fullName = fullName;
    }

    if (dateOfBirth) {
      payload.dateOfBirth = new Date(dateOfBirth);
    }

    // Update user
    await this.userRepository.update(id, {
      ...payload,
      updatedAt: new Date(),
    });

    const updatedUser = await this.findOneById(id);
    return this.toUserResponse(updatedUser!);
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update slug if fullName is being updated
    let slug = user.slug;
    if (
      updateProfileDto.fullName &&
      updateProfileDto.fullName !== user.fullName
    ) {
      const baseSlug = slugify(updateProfileDto.fullName, {
        lower: true,
        strict: true,
      });
      slug = await this.generateUniqueSlug(baseSlug, id);
    }

    // Handle date conversion
    let dateOfBirth = user.dateOfBirth;
    if (updateProfileDto.dateOfBirth) {
      dateOfBirth = new Date(updateProfileDto.dateOfBirth);
    }

    // Update user
    await this.userRepository.update(id, {
      ...updateProfileDto,
      slug,
      dateOfBirth,
      updatedAt: new Date(),
    });

    const updatedUser = await this.findOneById(id);
    return this.toUserResponse(updatedUser!);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Update password
    await this.userRepository.update(id, {
      password: hashedPassword,
      updatedAt: new Date(),
    });
  }

  async remove(id: string, deletedById?: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(id, {
      deletedAt: new Date(),
      deletedById,
      updatedAt: new Date(),
    });
  }

  async toggleActive(id: string): Promise<UserResponseDto> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(id, {
      isActive: !user.isActive,
      updatedAt: new Date(),
    });

    const updatedUser = await this.findOneById(id);
    return this.toUserResponse(updatedUser!);
  }

  async verifyEmail(id: string): Promise<void> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(id, {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
      updatedAt: new Date(),
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogin: new Date(),
      updatedAt: new Date(),
    });
  }

  private async generateUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.isSlugExists(slug, excludeId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async isSlugExists(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.slug = :slug', { slug })
      .andWhere('user.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('user.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private toUserResponse(user: User): UserResponseDto {
    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
