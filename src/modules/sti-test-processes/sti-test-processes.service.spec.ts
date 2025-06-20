import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsService } from '../appointments/appointments.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TestResultsService } from '../test-results/test-results.service';
import { UsersService } from '../users/users.service';
import {
    ProcessPriority,
    StiSampleType,
    StiTestProcess,
    StiTestProcessStatus,
} from './entities/sti-test-process.entity';
import { StiTestProcessesService } from './sti-test-processes.service';

describe('StiTestProcessesService', () => {
    let service: StiTestProcessesService;
    let repository: Repository<StiTestProcess>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockTestResultsService = {
        create: jest.fn(),
        findById: jest.fn(),
    };

    const mockAppointmentsService = {
        findById: jest.fn(),
    };

    const mockNotificationsService = {
        create: jest.fn(),
    };

    const mockMailService = {
        sendTestResultNotification: jest.fn(),
    };

    const mockUsersService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StiTestProcessesService,
                {
                    provide: getRepositoryToken(StiTestProcess),
                    useValue: mockRepository,
                },
                {
                    provide: TestResultsService,
                    useValue: mockTestResultsService,
                },
                {
                    provide: AppointmentsService,
                    useValue: mockAppointmentsService,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<StiTestProcessesService>(StiTestProcessesService);
        repository = module.get<Repository<StiTestProcess>>(
            getRepositoryToken(StiTestProcess),
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new STI test process', async () => {
            const createDto = {
                serviceId: 'service-id',
                patientId: 'patient-id',
                sampleType: StiSampleType.BLOOD,
            };

            const mockUser = {
                id: 'patient-id',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            };

            const mockStiTestProcess = {
                id: 'process-id',
                testCode: 'STI123456',
                status: StiTestProcessStatus.ORDERED,
                sampleType: StiSampleType.BLOOD,
                priority: ProcessPriority.NORMAL,
                patient: mockUser,
                service: { id: createDto.serviceId },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUsersService.findOne.mockResolvedValue(mockUser);
            mockRepository.findOne.mockResolvedValue(null); // No existing test code
            mockRepository.create.mockReturnValue(mockStiTestProcess);
            mockRepository.save.mockResolvedValue(mockStiTestProcess);

            // Mock the findById method that will be called at the end
            jest.spyOn(service, 'findById').mockResolvedValue(
                mockStiTestProcess as any,
            );

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('process-id');
            expect(mockUsersService.findOne).toHaveBeenCalledWith(
                createDto.patientId,
            );
            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if patient not found', async () => {
            const createDto = {
                serviceId: 'service-id',
                patientId: 'invalid-patient-id',
                sampleType: StiSampleType.BLOOD,
            };

            mockUsersService.findOne.mockResolvedValue(null);

            await expect(service.create(createDto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findById', () => {
        it('should return a STI test process by id', async () => {
            const id = 'process-id';
            const mockStiTestProcess = {
                id,
                testCode: 'STI123456',
                status: StiTestProcessStatus.ORDERED,
                patient: {
                    id: 'patient-id',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                },
                service: {
                    id: 'service-id',
                    name: 'STI Test',
                    description: 'STI Testing Service',
                    price: 100,
                },
            };

            mockRepository.findOne.mockResolvedValue(mockStiTestProcess);

            const result = await service.findById(id);

            expect(result).toBeDefined();
            expect(result.id).toBe(id);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id },
                relations: [
                    'patient',
                    'service',
                    'appointment',
                    'testResult',
                    'consultantDoctor',
                ],
            });
        });

        it('should throw NotFoundException if process not found', async () => {
            const id = 'invalid-id';
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findById(id)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByTestCode', () => {
        it('should return a STI test process by test code', async () => {
            const testCode = 'STI123456';
            const mockStiTestProcess = {
                id: 'process-id',
                testCode,
                status: StiTestProcessStatus.ORDERED,
            };

            mockRepository.findOne.mockResolvedValue(mockStiTestProcess);

            const result = await service.findByTestCode(testCode);

            expect(result).toBeDefined();
            expect(result.testCode).toBe(testCode);
        });

        it('should throw NotFoundException if test code not found', async () => {
            const testCode = 'INVALID123';
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findByTestCode(testCode)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update a STI test process', async () => {
            const id = 'process-id';
            const updateDto = {
                status: StiTestProcessStatus.PROCESSING,
                labNotes: 'Sample received and processing',
            };

            const existingProcess = {
                id,
                testCode: 'STI123456',
                status: StiTestProcessStatus.ORDERED,
                patient: { id: 'patient-id' },
            };

            mockRepository.findOne.mockResolvedValue(existingProcess);
            mockRepository.update.mockResolvedValue({ affected: 1 });

            // Mock findById for the return value
            jest.spyOn(service, 'findById').mockResolvedValue({
                ...existingProcess,
                ...updateDto,
            } as any);

            const result = await service.update(id, updateDto);

            expect(result).toBeDefined();
            expect(mockRepository.update).toHaveBeenCalledWith(id, updateDto);
        });

        it('should throw NotFoundException if process not found', async () => {
            const id = 'invalid-id';
            const updateDto = {
                status: StiTestProcessStatus.PROCESSING,
            };

            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.update(id, updateDto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateStatus', () => {
        it('should update the status of a STI test process', async () => {
            const id = 'process-id';
            const newStatus = StiTestProcessStatus.PROCESSING;

            const updatedProcess = {
                id,
                testCode: 'STI123456',
                status: newStatus,
            };

            jest.spyOn(service, 'update').mockResolvedValue(
                updatedProcess as any,
            );

            const result = await service.updateStatus(id, newStatus);

            expect(result).toBeDefined();
            expect(result.status).toBe(newStatus);
            expect(service.update).toHaveBeenCalledWith(id, {
                status: newStatus,
            });
        });
    });

    describe('findAll', () => {
        it('should return paginated list of STI test processes', async () => {
            const query = {
                page: 1,
                limit: 10,
                status: StiTestProcessStatus.ORDERED,
            };

            const mockData = [
                {
                    id: 'process-1',
                    testCode: 'STI123456',
                    status: StiTestProcessStatus.ORDERED,
                },
            ];

            mockRepository.findAndCount.mockResolvedValue([mockData, 1]);

            const result = await service.findAll(query);

            expect(result).toBeDefined();
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });
});
