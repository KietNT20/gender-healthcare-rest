import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
} as User;
const mockUsersArray = [mockUser];

// Mock UsersService
const mockUsersService = {
  create: jest.fn().mockResolvedValue(mockUser),
  findAll: jest.fn().mockResolvedValue(mockUsersArray),
  findOne: jest.fn().mockResolvedValue(mockUser),
  update: jest.fn().mockResolvedValue(mockUser),
  updateProfile: jest.fn().mockResolvedValue(mockUser),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call service.create with the correct DTO and return a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password',
        fullName: 'Test User',
        roleId: '1',
      };
      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll()', () => {
    it('should call service.findAll and return an array of users', async () => {
      const result = await controller.findAll({
        page: 1,
        limit: 10,
      });

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsersArray);
    });
  });

  describe('findOne()', () => {
    it('should call service.findOne with the correct id and return a user', async () => {
      const id = '1';
      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const id = 'non-existent-id';
      // Giả lập service ném lỗi
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should call service.update with correct id and DTO', async () => {
      const id = '1';
      const updateUserDto: UpdateUserDto = { fullName: 'Updated Name' };

      await controller.update(id, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(id, updateUserDto);
    });
  });

  describe('remove()', () => {
    it('should call service.remove with the correct id', async () => {
      const id = '1';
      await controller.remove(id, mockUser);

      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});
