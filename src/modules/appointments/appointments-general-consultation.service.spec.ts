import { Test, TestingModule } from '@nestjs/testing';
import { LocationTypeEnum } from 'src/enums';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAvailableSlotsDto } from './dto/find-available-slots.dto';

describe('AppointmentsService - General vs Service Consultation', () => {
    let service: AppointmentsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppointmentsService],
        }).compile();

        service = module.get<AppointmentsService>(AppointmentsService);
    });

    describe('findAvailableSlots', () => {
        it('should find slots for general consultation (no serviceIds)', async () => {
            // Arrange
            const findSlotsDto: FindAvailableSlotsDto = {
                startDate: new Date('2025-07-10'),
                endDate: new Date('2025-07-17'),
                startTime: '08:00',
                endTime: '18:00',
                // serviceIds không được truyền hoặc là undefined
            };

            // Act & Assert
            // Không được throw error khi serviceIds không có
            expect(() =>
                service.findAvailableSlots(findSlotsDto),
            ).not.toThrow();
        });

        it('should find slots for service consultation (with serviceIds)', async () => {
            // Arrange
            const findSlotsDto: FindAvailableSlotsDto = {
                serviceIds: ['service-uuid-1', 'service-uuid-2'],
                startDate: new Date('2025-07-10'),
                endDate: new Date('2025-07-17'),
                startTime: '08:00',
                endTime: '18:00',
            };

            // Act & Assert
            expect(() =>
                service.findAvailableSlots(findSlotsDto),
            ).not.toThrow();
        });

        it('should find slots for specific consultant (general consultation)', async () => {
            // Arrange
            const findSlotsDto: FindAvailableSlotsDto = {
                // serviceIds không có (tư vấn tổng quát)
                consultantId: 'consultant-uuid-123',
                startDate: new Date('2025-07-10'),
                endDate: new Date('2025-07-17'),
            };

            // Act & Assert
            expect(() =>
                service.findAvailableSlots(findSlotsDto),
            ).not.toThrow();
        });
    });

    describe('create appointment', () => {
        it('should create general consultation appointment', async () => {
            // Arrange
            const createDto: CreateAppointmentDto = {
                // serviceIds không có (tư vấn tổng quát)
                consultantId: 'consultant-uuid-123',
                appointmentDate: new Date('2025-07-10T09:00:00.000Z'),
                appointmentLocation: LocationTypeEnum.ONLINE,
                notes: 'Tư vấn tổng quát về sức khỏe phụ nữ',
            };

            // Act & Assert
            // Không được throw error khi serviceIds không có nhưng có consultantId
            expect(() => service.create(createDto, mockUser)).not.toThrow();
        });

        it('should create service consultation appointment', async () => {
            // Arrange
            const createDto: CreateAppointmentDto = {
                serviceIds: ['service-uuid-1'],
                consultantId: 'consultant-uuid-123',
                appointmentDate: new Date('2025-07-10T09:00:00.000Z'),
                appointmentLocation: LocationTypeEnum.ONLINE,
                notes: 'Tư vấn về dịch vụ cụ thể',
            };

            // Act & Assert
            expect(() => service.create(createDto, mockUser)).not.toThrow();
        });

        it('should throw error when neither serviceIds nor consultantId provided', async () => {
            // Arrange
            const createDto: CreateAppointmentDto = {
                // Không có serviceIds và consultantId
                appointmentDate: new Date('2025-07-10T09:00:00.000Z'),
                appointmentLocation: LocationTypeEnum.ONLINE,
                notes: 'Invalid appointment',
            };

            // Act & Assert
            await expect(service.create(createDto, mockUser)).rejects.toThrow(
                'Phải cung cấp ít nhất serviceIds hoặc consultantId để tạo cuộc hẹn.',
            );
        });
    });
});

// Mock data
const mockUser = {
    id: 'user-uuid-123',
    firstName: 'Test',
    lastName: 'User',
    role: { name: 'CUSTOMER' },
} as any;
