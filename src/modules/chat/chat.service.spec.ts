import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesNameEnum } from '../../enums';
import { FilesService } from '../files/files.service';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Question } from './entities/question.entity';

describe('ChatService', () => {
    let service: ChatService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatService],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

describe('ChatService - Access Control', () => {
    let service: ChatService;
    let questionRepository: Repository<Question>;
    let userRepository: Repository<User>;
    let messageRepository: Repository<Message>;

    const mockQuestion = {
        id: 'question-1',
        title: 'Test Question',
        content: 'Test content',
        user: { id: 'customer-1' },
        appointment: {
            id: 'appointment-1',
            consultant: { id: 'consultant-1' },
        },
    };

    const mockCustomer = {
        id: 'customer-1',
        role: { name: RolesNameEnum.CUSTOMER },
    };

    const mockAssignedConsultant = {
        id: 'consultant-1',
        role: { name: RolesNameEnum.CONSULTANT },
    };

    const mockOtherConsultant = {
        id: 'consultant-2',
        role: { name: RolesNameEnum.CONSULTANT },
    };

    const mockStaff = {
        id: 'staff-1',
        role: { name: RolesNameEnum.STAFF },
    };

    const mockAdmin = {
        id: 'admin-1',
        role: { name: RolesNameEnum.ADMIN },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                {
                    provide: getRepositoryToken(Question),
                    useValue: {
                        findOne: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Message),
                    useValue: {
                        find: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
                {
                    provide: FilesService,
                    useValue: {
                        uploadFile: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
        questionRepository = module.get<Repository<Question>>(
            getRepositoryToken(Question),
        );
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        messageRepository = module.get<Repository<Message>>(
            getRepositoryToken(Message),
        );
    });

    describe('verifyQuestionAccess', () => {
        beforeEach(() => {
            jest.spyOn(questionRepository, 'findOne').mockResolvedValue(
                mockQuestion as any,
            );
        });

        it('should allow customer access to their own question', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockCustomer as any,
            );

            const result = await service.verifyQuestionAccess(
                'question-1',
                'customer-1',
            );

            expect(result).toBe(true);
        });

        it('should allow assigned consultant access to the question', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockAssignedConsultant as any,
            );

            const result = await service.verifyQuestionAccess(
                'question-1',
                'consultant-1',
            );

            expect(result).toBe(true);
        });

        it('should deny other consultant access to the question', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockOtherConsultant as any,
            );

            const result = await service.verifyQuestionAccess(
                'question-1',
                'consultant-2',
            );

            expect(result).toBe(false);
        });

        it('should allow staff access to all questions', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockStaff as any,
            );

            const result = await service.verifyQuestionAccess(
                'question-1',
                'staff-1',
            );

            expect(result).toBe(true);
        });

        it('should allow admin access to all questions', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockAdmin as any,
            );

            const result = await service.verifyQuestionAccess(
                'question-1',
                'admin-1',
            );

            expect(result).toBe(true);
        });

        it('should throw NotFoundException when question not found', async () => {
            jest.spyOn(questionRepository, 'findOne').mockResolvedValue(null);

            await expect(
                service.verifyQuestionAccess('non-existent', 'customer-1'),
            ).rejects.toThrow('Question not found');
        });

        it('should throw NotFoundException when user not found', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

            await expect(
                service.verifyQuestionAccess('question-1', 'non-existent'),
            ).rejects.toThrow('User not found');
        });
    });

    describe('getUserAccessibleQuestions', () => {
        const mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
        };

        beforeEach(() => {
            jest.spyOn(
                questionRepository,
                'createQueryBuilder',
            ).mockReturnValue(mockQueryBuilder as any);
        });

        it('should return customer questions for customer', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockCustomer as any,
            );
            mockQueryBuilder.getMany.mockResolvedValue([mockQuestion]);

            const result =
                await service.getUserAccessibleQuestions('customer-1');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'question.user.id = :userId',
                { userId: 'customer-1' },
            );
            expect(result).toEqual([mockQuestion]);
        });

        it('should return assigned questions for consultant', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockAssignedConsultant as any,
            );
            mockQueryBuilder.getMany.mockResolvedValue([mockQuestion]);

            const result =
                await service.getUserAccessibleQuestions('consultant-1');

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'appointment.consultant.id = :userId',
                { userId: 'consultant-1' },
            );
            expect(result).toEqual([mockQuestion]);
        });

        it('should return all questions for staff', async () => {
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockStaff as any,
            );
            mockQueryBuilder.getMany.mockResolvedValue([mockQuestion]);

            const result = await service.getUserAccessibleQuestions('staff-1');

            expect(mockQueryBuilder.where).not.toHaveBeenCalled();
            expect(result).toEqual([mockQuestion]);
        });

        it('should return empty array for unknown role', async () => {
            const mockUnknownUser = {
                id: 'unknown-1',
                role: { name: 'unknown' },
            };
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(
                mockUnknownUser as any,
            );

            const result =
                await service.getUserAccessibleQuestions('unknown-1');

            expect(result).toEqual([]);
        });
    });
});
