import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import slugify from 'slugify';
import { Paginated } from 'src/common/pagination/interface/paginated.interface';
import { RolesNameEnum } from 'src/enums';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { Role } from '../roles/entities/role.entity';
import { CreateManyUsersDto } from './dto/create-many-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
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
        private readonly dataSource: DataSource,
        private readonly hashingProvider: HashingProvider,
    ) {}

    /**
     *
     * @param createUserDto The DTO containing user creation data.
     * @throws ConflictException if the email already exists.
     * @returns The created user data.
     */
    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        // Check if email already exists
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email này đã tồn tại');
        }

        // Hash password
        const hashedPassword = await this.hashingProvider.hashPassword(
            createUserDto.password,
        );

        const genSlug = `${createUserDto.firstName} ${createUserDto.email}`;

        // Generate unique slug
        const baseSlug = slugify(genSlug, {
            lower: true,
            strict: true,
        });
        const slug = await this.generateUniqueSlug(baseSlug);

        const userRole = await this.roleRepository.findOneBy({
            id: createUserDto.roleId,
        });

        if (!userRole) {
            throw new BadRequestException('Invalid role ID');
        }

        // Create user
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            slug,
            dateOfBirth: createUserDto.dateOfBirth
                ? new Date(createUserDto.dateOfBirth)
                : undefined,
            role: userRole,
            emailVerified: true,
            phoneVerified: true,
        });

        const savedUser = await this.userRepository.save(user);

        // Return user without password
        return this.toUserResponse(savedUser);
    }

    /**
     * Creates multiple users in a single transaction for better performance and data integrity.
     * @param createManyUsersDto The DTO containing an array of user data.
     * @returns A promise that resolves to an array of the created users.
     * @throws {ConflictException} If any emails in the payload already exist or are duplicated.
     * @throws {BadRequestException} If any provided roleId is invalid.
     * @throws {InternalServerErrorException} If the transaction fails for other reasons.
     */
    async createMany(
        createManyUsersDto: CreateManyUsersDto,
    ): Promise<UserResponseDto[]> {
        // Start a database transaction.
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Validate for duplicate emails within the request payload.
            const emails = createManyUsersDto.users.map((user) =>
                user.email.toLowerCase(),
            );
            const emailSet = new Set(emails);
            if (emailSet.size !== emails.length) {
                throw new ConflictException(
                    'Duplicate emails found in the request payload.',
                );
            }

            // 2. Check against the database for any existing emails.
            const existingUsers = await queryRunner.manager.find(User, {
                where: { email: In(emails) },
                select: ['email'],
            });

            if (existingUsers.length > 0) {
                const existingEmails = existingUsers
                    .map((u) => u.email)
                    .join(', ');
                throw new ConflictException(
                    `These emails already exist: ${existingEmails}`,
                );
            }

            // 3. Fetch all required roles in a single query for efficiency.
            const roleIds = [
                ...new Set(createManyUsersDto.users.map((u) => u.roleId)),
            ];
            const roles = await queryRunner.manager.findBy(Role, {
                id: In(roleIds),
            });
            const roleMap = new Map(roles.map((role) => [role.id, role]));

            // 4. Prepare all user entities concurrently using Promise.all.
            const userPromises = createManyUsersDto.users.map(
                async (userData) => {
                    const hashedPassword =
                        await this.hashingProvider.hashPassword(
                            userData.password,
                        );

                    const baseSlug = slugify(userData.email, {
                        lower: true,
                        strict: true,
                    });
                    const slug = await this.generateUniqueSlugInTransaction(
                        queryRunner.manager,
                        baseSlug,
                    );

                    const userRole = roleMap.get(userData.roleId);
                    if (!userRole) {
                        // This check ensures data consistency before insertion.
                        throw new BadRequestException(
                            `Invalid role ID provided: ${userData.roleId}`,
                        );
                    }

                    // Create an entity instance without saving it yet.
                    return queryRunner.manager.create(User, {
                        ...userData,
                        email: userData.email.toLowerCase(),
                        password: hashedPassword,
                        slug,
                        role: userRole, // Assign the full Role entity object for the relationship.
                        dateOfBirth: userData.dateOfBirth
                            ? new Date(userData.dateOfBirth)
                            : undefined,
                        emailVerified: true, // Assuming bulk-created users are pre-verified.
                        phoneVerified: true,
                    });
                },
            );

            const usersToCreate = await Promise.all(userPromises);

            // 5. Perform a single bulk insert operation for all prepared user entities.
            // Using a chunk size helps manage memory for very large arrays.
            const newUsers = await queryRunner.manager.save(usersToCreate, {
                chunk: 100,
            });

            // 6. If all operations succeed, commit the transaction.
            await queryRunner.commitTransaction();

            // 7. Return the created users, mapping them to the response DTO.
            return newUsers.map((user) => this.toUserResponse(user));
        } catch (error) {
            // If any error occurs, roll back the entire transaction.
            await queryRunner.rollbackTransaction();

            // Re-throw known client errors or a generic server error for unknown issues.
            if (
                error instanceof ConflictException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Could not complete the bulk user creation.',
                {
                    description: String(error),
                },
            );
        } finally {
            // Always release the query runner to free up the database connection.
            await queryRunner.release();
        }
    }

    async findAll(
        userQueryDto: UserQueryDto,
    ): Promise<Paginated<UserResponseDto>> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.deletedAt IS NULL');

        this.applyUserFilters(queryBuilder, userQueryDto);

        const offset = (userQueryDto.page! - 1) * userQueryDto.limit!;
        queryBuilder.skip(offset).take(userQueryDto.limit!);

        const allowedSortFields = [
            'firstName',
            'lastName',
            'email',
            'createdAt',
            'updatedAt',
        ];

        if (!userQueryDto.sortBy) {
            userQueryDto.sortBy = 'createdAt';
        }
        const sortField = allowedSortFields.includes(userQueryDto.sortBy)
            ? userQueryDto.sortBy
            : 'createdAt';

        queryBuilder.orderBy(`user.${sortField}`, userQueryDto.sortOrder);

        // Execute và format response
        const [users, totalItems] = await queryBuilder.getManyAndCount();

        return {
            data: users.map((user) => this.toUserResponse(user)),
            meta: {
                itemsPerPage: userQueryDto.limit || 10,
                totalItems,
                currentPage: userQueryDto.page || 1,
                totalPages: Math.ceil(totalItems / (userQueryDto.limit || 10)),
            },
        };
    }

    /**
     * Applies user filters to the query builder.
     * @param queryBuilder The query builder to apply filters to.
     * @param userQueryDto The DTO containing filter criteria.
     */
    private applyUserFilters(
        queryBuilder: any,
        userQueryDto: UserQueryDto,
    ): void {
        const { firstName, lastName, email, phone, roleId, isActive } =
            userQueryDto;

        if (firstName) {
            queryBuilder.andWhere('user.firstName ILIKE :firstName', {
                firstName: `%${firstName}%`,
            });
        }

        if (lastName) {
            queryBuilder.andWhere('user.lastName ILIKE :lastName', {
                lastName: `%${lastName}%`,
            });
        }

        if (email) {
            queryBuilder.andWhere('user.email ILIKE :email', {
                email: `%${email}%`,
            });
        }

        if (phone) {
            queryBuilder.andWhere('user.phone ILIKE :phone', {
                phone: `%${phone}%`,
            });
        }

        if (roleId) {
            queryBuilder.andWhere('user.roleId = :roleId', { roleId });
        }

        if (isActive !== undefined) {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive });
        }
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

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOneBy({
            email,
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
                'firstName',
                'lastName',
                'isActive',
                'emailVerified',
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
            select: [
                'id',
                'email',
                'firstName',
                'lastName',
                'isActive',
                'refreshToken',
            ],
        });

        if (!user || !user.refreshToken) {
            return null;
        }

        // Compare the provided refresh token with the hashed one in database
        const isValidRefreshToken = await this.hashingProvider.comparePassword(
            refreshToken,
            user.refreshToken,
        );

        return isValidRefreshToken ? user : null;
    }

    async findOneByGoogleId(googleId: string) {
        return this.userRepository.findOneBy({ googleId });
    }

    async updateGoogleProfile(
        id: string,
        googleId: string,
        profilePicture?: string,
    ): Promise<User> {
        const googleIdExists = await this.userRepository.findOneBy({
            googleId,
        });

        if (googleIdExists && googleIdExists.id !== id) {
            throw new ConflictException(
                'Tài khoản Google đã được liên kết với người dùng khác',
            );
        }

        const user = await this.userRepository.findOneBy({
            id,
            deletedAt: IsNull(),
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng này');
        }

        const dataToMerge: Partial<User> = {
            googleId,
            emailVerified: true,
        };

        if (profilePicture) {
            dataToMerge.profilePicture = profilePicture;
        }

        this.userRepository.merge(user, dataToMerge);

        return this.userRepository.save(user);
    }

    async getCustomerRoleId(): Promise<string> {
        const customerRole = await this.roleRepository.findOneBy({
            name: RolesNameEnum.CUSTOMER,
        });

        if (!customerRole) {
            throw new NotFoundException('Không tìm thấy vai trò khách hàng');
        }

        return customerRole.id;
    }

    async incrementLoginAttempts(id: string): Promise<void> {
        const user = await this.findOne(id);
        if (!user) return;

        const newAttempts = user.loginAttempts + 1;
        const updateData: Partial<User> = {
            loginAttempts: newAttempts,
            updatedAt: new Date(),
        };

        // Lock account after 10 failed attempts for 30 minutes
        if (newAttempts >= 10) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + 30);
            updateData.accountLockedUntil = lockUntil;
        }

        await this.userRepository.update(id, {
            ...updateData,
            updatedAt: new Date(),
        });
    }

    async resetLoginAttempts(id: string): Promise<void> {
        await this.userRepository.update(id, {
            loginAttempts: 0,
            updatedAt: new Date(),
        });
    }

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        // Hash the refresh token before storing
        const hashedRefreshToken =
            await this.hashingProvider.hashPassword(refreshToken);

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
        const user = await this.findOne(id);
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

        const { dateOfBirth, firstName, lastName, ...restOfDto } =
            updateUserDto;
        const payload: Partial<User> = { ...restOfDto };

        // Update slug if firstName or lastName is being updated
        if (
            firstName &&
            firstName !== user.firstName &&
            lastName &&
            lastName !== user.lastName
        ) {
            // Generate slug based on firstName and lastName
            const genSlug = `${firstName} ${lastName} ${user.email}`;
            // Use slugify to create a base slug
            const baseSlug = slugify(genSlug, { lower: true, strict: true });
            payload.slug = await this.generateUniqueSlug(baseSlug, id);
        }

        if (lastName && lastName !== user.lastName) {
            payload.lastName = lastName;
        }
        // Handle date conversion
        if (dateOfBirth) {
            payload.dateOfBirth = new Date(dateOfBirth);
        }

        const updatedUser = await this.userRepository.findOne({
            where: { id, deletedAt: IsNull() },
        });

        if (!updatedUser) {
            throw new InternalServerErrorException(
                'Failed to update user, user not found after update',
            );
        }

        // Update user
        await this.userRepository.save({
            ...updatedUser,
            ...payload,
            updatedAt: new Date(),
        });

        return this.toUserResponse(updatedUser);
    }

    async updateProfile(
        id: string,
        updateProfileDto: UpdateProfileDto,
    ): Promise<UserResponseDto> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Update slug if firstName or lastName is being updated
        let slug = user.slug;
        if (
            updateProfileDto.firstName &&
            updateProfileDto.firstName !== user.firstName &&
            updateProfileDto.lastName &&
            updateProfileDto.lastName !== user.lastName
        ) {
            const genSlug = `${updateProfileDto.firstName} ${updateProfileDto.lastName} ${user.email}`;
            const baseSlug = slugify(genSlug, {
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

        const updatedUser = await this.userRepository.findOneBy({
            id,
            deletedAt: IsNull(),
        });

        if (!updatedUser) {
            throw new InternalServerErrorException(
                'Failed to update user, user not found after update',
            );
        }

        // Update user profile
        await this.userRepository.save({
            ...updatedUser,
            slug,
            dateOfBirth,
            updatedAt: new Date(),
        });

        return this.toUserResponse(updatedUser);
    }

    async changePassword(
        id: string,
        changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        const user = await this.findOne(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.password) {
            throw new BadRequestException('User password not found');
        }

        // Verify current password
        const isValidPassword = await this.hashingProvider.comparePassword(
            changePasswordDto.currentPassword,
            user.password,
        );

        if (!isValidPassword) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await this.hashingProvider.hashPassword(
            changePasswordDto.newPassword,
        );

        // Update password
        await this.userRepository.update(id, {
            password: hashedPassword,
            updatedAt: new Date(),
        });
    }

    async remove(id: string, deletedByUserId?: string): Promise<void> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepository.update(id, {
            deletedAt: new Date(),
            deletedByUserId: deletedByUserId,
            updatedAt: new Date(),
        });
    }

    async toggleActive(id: string): Promise<UserResponseDto> {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.update(id, {
            isActive: !user.isActive,
            updatedAt: new Date(),
        });

        const updatedUser = await this.userRepository.findOneBy({
            id,
            deletedAt: IsNull(),
        });

        if (!updatedUser) {
            throw new InternalServerErrorException(
                'Failed to update user, user not found after update',
            );
        }

        return this.toUserResponse(updatedUser);
    }

    async verifyEmail(id: string): Promise<void> {
        const user = await this.findOne(id);
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

    // Helper method for generating unique slug in transaction
    private async generateUniqueSlugInTransaction(
        manager: EntityManager,
        baseSlug: string,
    ): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (await this.isSlugExistsInTransaction(manager, slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    private async isSlugExistsInTransaction(
        manager: EntityManager,
        slug: string,
    ): Promise<boolean> {
        const count = await manager.count(User, {
            where: {
                slug,
                deletedAt: IsNull(),
            },
        });
        return count > 0;
    }

    private toUserResponse(user: User): UserResponseDto {
        return plainToClass(UserResponseDto, user);
    }
}
