import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesNameEnum } from 'src/enums';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { HashingProvider } from '../auth/providers/hashing.provider';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: Repository<User>;
    let roleRepository: Repository<Role>;
    let hashingProvider: HashingProvider;
    let dataSource: DataSource;

    const mockUser: Partial<User> = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        slug: 'john-doe',
        loginAttempts: 0,
        phoneVerified: false,
        notificationPreferences: {
            push: true,
            email: true,
        },
    };

    const mockRole = {
        id: '1',
        name: RolesNameEnum.CUSTOMER,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        findOneBy: jest.fn(),
                        update: jest
                            .fn()
                            .mockResolvedValue({ affected: 1 } as UpdateResult),
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            where: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            skip: jest.fn().mockReturnThis(),
                            take: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            getManyAndCount: jest
                                .fn()
                                .mockResolvedValue([[mockUser], 1]),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(Role),
                    useValue: {
                        findOneBy: jest.fn(),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: jest.fn(() => ({
                            connect: jest.fn(),
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            rollbackTransaction: jest.fn(),
                            release: jest.fn(),
                            manager: {
                                find: jest.fn(),
                                create: jest.fn(),
                                save: jest.fn(),
                                count: jest.fn(),
                            },
                        })),
                    },
                },
                {
                    provide: HashingProvider,
                    useValue: {
                        hashPassword: jest
                            .fn()
                            .mockResolvedValue('hashedPassword'),
                        comparePassword: jest.fn().mockResolvedValue(true),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
        hashingProvider = module.get<HashingProvider>(HashingProvider);
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new user successfully', async () => {
            const createUserDto: CreateUserDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                roleId: '1',
            };

            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(userRepository, 'create').mockReturnValue(
                mockUser as User,
            );
            jest.spyOn(userRepository, 'save').mockResolvedValue(
                mockUser as User,
            );

            const result = await service.create(createUserDto, '1');

            expect(result).toBeDefined();
            expect(result.email).toBe(createUserDto.email);
            expect(userRepository.create).toHaveBeenCalled();
            expect(userRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            const createUserDto: CreateUserDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                roleId: '1',
            };

            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockUser as User,
            );

            await expect(service.create(createUserDto, '1')).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('findOne', () => {
        it('should return a user by id', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockUser as User,
            );

            const result = await service.findOne('1');

            expect(result).toBeDefined();
            expect(result.id).toBe('1');
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update a user successfully', async () => {
            const updateUserDto: UpdateUserDto = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            const updatedUser = {
                ...mockUser,
                firstName: 'Jane',
                lastName: 'Smith',
            };

            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(
                mockUser as User,
            );
            jest.spyOn(userRepository, 'update').mockResolvedValue({
                affected: 1,
            } as UpdateResult);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                updatedUser as User,
            );

            const result = await service.update('1', updateUserDto, 'admin-id');

            expect(result).toBeDefined();
            expect(result).toEqual(
                expect.objectContaining({
                    firstName: updateUserDto.firstName,
                    lastName: updateUserDto.lastName,
                }),
            );
        });

        it('should throw NotFoundException if user not found', async () => {
            const updateUserDto: UpdateUserDto = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(null);

            await expect(
                service.update('1', updateUserDto, 'admin-id'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            const updateProfileDto: UpdateProfileDto = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            const updatedUser = {
                ...mockUser,
                firstName: 'Jane',
                lastName: 'Smith',
            };

            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(
                mockUser as User,
            );
            jest.spyOn(userRepository, 'update').mockResolvedValue({
                affected: 1,
            } as UpdateResult);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                updatedUser as User,
            );

            const result = await service.updateProfile('1', updateProfileDto);

            expect(result).toBeDefined();
            expect(result).toEqual(
                expect.objectContaining({
                    firstName: updateProfileDto.firstName,
                    lastName: updateProfileDto.lastName,
                }),
            );
        });

        it('should throw NotFoundException if user not found', async () => {
            const updateProfileDto: UpdateProfileDto = {
                firstName: 'Jane',
                lastName: 'Smith',
            };

            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(null);

            await expect(
                service.updateProfile('1', updateProfileDto),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('toggleActive', () => {
        it('should toggle user active status', async () => {
            const inactiveUser = {
                ...mockUser,
                isActive: false,
            };

            jest.spyOn(userRepository, 'findOneById')
                .mockResolvedValueOnce(mockUser as User)
                .mockResolvedValueOnce(inactiveUser as User);
            jest.spyOn(userRepository, 'update').mockResolvedValue({
                affected: 1,
            } as UpdateResult);

            const result = await service.toggleActive('1');

            expect(result).toBeDefined();
            expect(result.isActive).toBe(false);
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(null);

            await expect(service.toggleActive('1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should soft delete a user', async () => {
            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(
                mockUser as User,
            );
            jest.spyOn(userRepository, 'update').mockResolvedValue({
                affected: 1,
            } as UpdateResult);

            await service.remove('1', 'admin-id');

            expect(userRepository.update).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    deletedAt: expect.any(Date),
                    deletedByUserId: 'admin-id',
                }),
            );
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(null);

            await expect(service.remove('1', 'admin-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('verifyEmail', () => {
        it('should verify user email', async () => {
            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(
                mockUser as User,
            );
            jest.spyOn(userRepository, 'update').mockResolvedValue({
                affected: 1,
            } as UpdateResult);

            await service.verifyEmail('1');

            expect(userRepository.update).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    emailVerified: true,
                    emailVerificationToken: undefined,
                    emailVerificationExpires: undefined,
                }),
            );
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findOneById').mockResolvedValue(null);

            await expect(service.verifyEmail('1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
