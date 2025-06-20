import { Test, TestingModule } from '@nestjs/testing';
import { StiTestProcessesController } from './sti-test-processes.controller';
import { StiTestProcessesService } from './sti-test-processes.service';

describe('StiTestProcessesController', () => {
    let controller: StiTestProcessesController;
    let service: StiTestProcessesService;

    const mockStiTestProcessesService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        findByTestCode: jest.fn(),
        findByPatientId: jest.fn(),
        update: jest.fn(),
        updateStatus: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StiTestProcessesController],
            providers: [
                {
                    provide: StiTestProcessesService,
                    useValue: mockStiTestProcessesService,
                },
            ],
        }).compile();

        controller = module.get<StiTestProcessesController>(
            StiTestProcessesController,
        );
        service = module.get<StiTestProcessesService>(StiTestProcessesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a new STI test process', async () => {
            const createDto = {
                serviceId: 'service-id',
                patientId: 'patient-id',
                sampleType: 'blood' as any,
            };

            const result = {
                id: 'process-id',
                testCode: 'STI123456',
                status: 'ordered' as any,
                ...createDto,
            };

            mockStiTestProcessesService.create.mockResolvedValue(result);

            expect(await controller.create(createDto)).toBe(result);
            expect(service.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('findAll', () => {
        it('should return a list of STI test processes', async () => {
            const query = { page: 1, limit: 10 };
            const result = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };

            mockStiTestProcessesService.findAll.mockResolvedValue(result);

            expect(await controller.findAll(query)).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('findOne', () => {
        it('should return a STI test process by id', async () => {
            const id = 'process-id';
            const result = {
                id,
                testCode: 'STI123456',
                status: 'ordered' as any,
            };

            mockStiTestProcessesService.findById.mockResolvedValue(result);

            expect(await controller.findOne(id)).toBe(result);
            expect(service.findById).toHaveBeenCalledWith(id);
        });
    });

    describe('findByTestCode', () => {
        it('should return a STI test process by test code', async () => {
            const testCode = 'STI123456';
            const result = {
                id: 'process-id',
                testCode,
                status: 'ordered' as any,
            };

            mockStiTestProcessesService.findByTestCode.mockResolvedValue(
                result,
            );

            expect(await controller.findByTestCode(testCode)).toBe(result);
            expect(service.findByTestCode).toHaveBeenCalledWith(testCode);
        });
    });

    describe('update', () => {
        it('should update a STI test process', async () => {
            const id = 'process-id';
            const updateDto = { status: 'processing' as any };
            const result = {
                id,
                testCode: 'STI123456',
                status: 'processing' as any,
            };

            mockStiTestProcessesService.update.mockResolvedValue(result);

            expect(await controller.update(id, updateDto)).toBe(result);
            expect(service.update).toHaveBeenCalledWith(id, updateDto);
        });
    });

    describe('updateStatus', () => {
        it('should update status of a STI test process', async () => {
            const id = 'process-id';
            const status = 'processing' as any;
            const result = {
                id,
                testCode: 'STI123456',
                status,
            };

            mockStiTestProcessesService.updateStatus.mockResolvedValue(result);

            expect(await controller.updateStatus(id, status)).toBe(result);
            expect(service.updateStatus).toHaveBeenCalledWith(id, status);
        });
    });

    describe('remove', () => {
        it('should remove a STI test process', async () => {
            const id = 'process-id';

            mockStiTestProcessesService.remove.mockResolvedValue(undefined);

            expect(await controller.remove(id)).toBeUndefined();
            expect(service.remove).toHaveBeenCalledWith(id);
        });
    });
});
