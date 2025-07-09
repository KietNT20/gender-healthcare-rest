import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenstrualPredictionsService } from 'src/modules/menstrual-predictions/menstrual-predictions.service';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateMenstrualCycleDto } from './dto/create-menstrual-cycle.dto';
import { MenstrualCycle } from './entities/menstrual-cycle.entity';
import { HealthDataConsentRequiredException } from './exceptions/health-data-consent-required.exception';
import { MenstrualCyclesService } from './menstrual-cycles.service';

describe('MenstrualCyclesService - Health Data Consent', () => {
    let service: MenstrualCyclesService;
    let userRepository: Repository<User>;
    let cycleRepository: Repository<MenstrualCycle>;
    let predictionsService: MenstrualPredictionsService;

    const mockUser = {
        id: 'user-id-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        healthDataConsent: false,
    };

    const mockUserWithConsent = {
        ...mockUser,
        healthDataConsent: true,
    };

    const mockCreateDto: CreateMenstrualCycleDto = {
        cycleStartDate: new Date('2025-01-01'),
        cycleEndDate: new Date('2025-01-05'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenstrualCyclesService,
                {
                    provide: getRepositoryToken(MenstrualCycle),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOneBy: jest.fn(),
                    },
                },
                {
                    provide: MenstrualPredictionsService,
                    useValue: {
                        predictAndUpdate: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<MenstrualCyclesService>(MenstrualCyclesService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        cycleRepository = module.get<Repository<MenstrualCycle>>(
            getRepositoryToken(MenstrualCycle),
        );
        predictionsService = module.get<MenstrualPredictionsService>(
            MenstrualPredictionsService,
        );
    });

    describe('create', () => {
        it('should throw HealthDataConsentRequiredException when user has not consented', async () => {
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
                mockUser as User,
            );

            await expect(
                service.create(mockUser.id, mockCreateDto),
            ).rejects.toThrow(HealthDataConsentRequiredException);
        });

        it('should create menstrual cycle when user has consented', async () => {
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
                mockUserWithConsent as User,
            );
            jest.spyOn(cycleRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(cycleRepository, 'create').mockReturnValue({} as any);
            jest.spyOn(cycleRepository, 'save').mockResolvedValue({} as any);
            jest.spyOn(
                predictionsService,
                'predictAndUpdate',
            ).mockResolvedValue({} as any);

            await expect(
                service.create(mockUserWithConsent.id, mockCreateDto),
            ).resolves.not.toThrow();

            expect(cycleRepository.create).toHaveBeenCalled();
            expect(cycleRepository.save).toHaveBeenCalled();
            expect(predictionsService.predictAndUpdate).toHaveBeenCalledWith(
                mockUserWithConsent.id,
            );
        });
    });

    describe('update', () => {
        it('should throw HealthDataConsentRequiredException when user has not consented', async () => {
            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
                mockUser as User,
            );

            await expect(
                service.update('cycle-id', mockUser.id, {}),
            ).rejects.toThrow(HealthDataConsentRequiredException);
        });

        it('should update menstrual cycle when user has consented', async () => {
            const mockCycle = { id: 'cycle-id', user: mockUserWithConsent };

            jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(
                mockUserWithConsent as User,
            );
            jest.spyOn(service, 'findOne').mockResolvedValue(mockCycle as any);
            jest.spyOn(cycleRepository, 'merge').mockReturnValue(
                mockCycle as any,
            );
            jest.spyOn(cycleRepository, 'save').mockResolvedValue(
                mockCycle as any,
            );

            await expect(
                service.update('cycle-id', mockUserWithConsent.id, {}),
            ).resolves.not.toThrow();

            expect(cycleRepository.save).toHaveBeenCalled();
        });
    });
});
