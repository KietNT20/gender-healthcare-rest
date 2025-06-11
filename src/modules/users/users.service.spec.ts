import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { GenderType, RolesNameEnum } from 'src/enums';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    slug: 'test-user',
    dateOfBirth: new Date('1990-01-01'),
    gender: GenderType.MALE,
    phone: '+84123456789',
    address: 'Test Address',
    profilePicture: undefined,
    isActive: true,
    accountLockedUntil: undefined,
    loginAttempts: 0,
    emailVerified: false,
    emailVerificationToken: undefined,
    emailVerificationExpires: new Date(),
    phoneVerified: false,
    passwordResetToken: undefined,
    passwordResetExpires: new Date(),
    lastLogin: new Date(),
    locale: 'vi',
    notificationPreferences: { sms: false, push: true, email: true },
    healthDataConsent: false,
    refreshToken: undefined,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: new Date(),
    role: {
      id: 'role-id',
      name: RolesNameEnum.CUSTOMER,
      description: 'Customer role',
      deletedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    deletedBy: undefined,
    consultantProfile: undefined,
    appointments: [],
    authoredBlogs: [],
    reviewedBlogs: [],
    publishedBlogs: [],
    questions: [],
    feedbacks: [],
    menstrualCycles: [],
    contraceptiveReminders: [],
    menstrualPredictions: [],
    payments: [],
    notifications: [],
    testResults: [],
    documents: [],
    images: [],
    auditLogs: [],
    employmentContracts: [],
    packageSubscriptions: [],
    verifiedConsultantProfiles: [],
  };

  const mockRole: Role = {
    id: 'role-id',
    name: RolesNameEnum.CUSTOMER,
    description: 'Customer role',
    deletedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+84123456789',
      address: 'Test Address',
      gender: GenderType.MALE,
      roleId: 'role-id',
      dateOfBirth: '1990-01-01',
      locale: 'vi',
    };

    it('should create a user successfully', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // Email doesn't exist
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(mockUser.id);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, deletedAt: null },
        relations: ['role'],
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(mockUser.email);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email.toLowerCase(), deletedAt: null },
        relations: ['role'],
      });
      expect(result).toBe(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      // Arrange
      const userId = mockUser.id;
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.updateLastLogin(userId);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
        lastLogin: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.verifyEmail(mockUser.id);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCustomerRoleId', () => {
    it('should return customer role id', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      // Act
      const result = await service.getCustomerRoleId();

      // Assert
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RolesNameEnum.CUSTOMER },
      });
      expect(result).toBe(mockRole.id);
    });

    it('should throw NotFoundException if customer role not found', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCustomerRoleId()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementLoginAttempts', () => {
    it('should increment login attempts', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.incrementLoginAttempts(mockUser.id);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: mockUser.loginAttempts + 1,
        updatedAt: expect.any(Date),
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      // Arrange
      const userWith4Attempts = { ...mockUser, loginAttempts: 4 };
      mockUserRepository.findOne.mockResolvedValue(userWith4Attempts);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.incrementLoginAttempts(mockUser.id);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: 5,
        accountLockedUntil: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('resetLoginAttempts', () => {
    it('should reset login attempts', async () => {
      // Arrange
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.resetLoginAttempts(mockUser.id);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        loginAttempts: 0,
        accountLockedUntil: null,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      // Arrange
      const refreshToken = 'refresh-token';
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashedRefreshToken' as never);

      // Act
      await service.updateRefreshToken(mockUser.id, refreshToken);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: 'hashedRefreshToken',
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('clearRefreshToken', () => {
    it('should clear refresh token', async () => {
      // Arrange
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      await service.clearRefreshToken(mockUser.id);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        refreshToken: null,
        updatedAt: expect.any(Date),
      });
    });
  });
});
