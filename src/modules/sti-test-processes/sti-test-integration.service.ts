import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { UsersService } from '../users/users.service';
import { CreateStiTestProcessDto } from './dto/create-sti-test-process.dto';
import { StiTestProcessResponseDto } from './dto/sti-test-process-response.dto';
import {
    ProcessPriority,
    StiSampleType,
} from './entities/sti-test-process.entity';
import { StiTestProcessesService } from './sti-test-processes.service';

export interface StiTestBookingRequest {
    patientId: string;
    serviceIds: string[];
    appointmentId?: string;
    consultantDoctorId?: string;
    notes?: string;
}

export interface StiTestBookingResponse {
    stiTestProcesses: StiTestProcessResponseDto[];
    estimatedCost: number;
    estimatedDuration: string;
}

@Injectable()
export class StiTestIntegrationService {
    constructor(
        private readonly stiTestProcessesService: StiTestProcessesService,
        private readonly usersService: UsersService,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
    ) {}

    /**
     * Tạo quy trình xét nghiệm STI từ việc chọn dịch vụ
     */
    async createStiTestFromServiceSelection(
        request: StiTestBookingRequest,
    ): Promise<StiTestBookingResponse> {
        // Validate request
        this.validateBookingRequest(request);

        // Validate patient
        const patient = await this.usersService.findOne(request.patientId);
        if (!patient) {
            throw new NotFoundException('Không tìm thấy bệnh nhân');
        }

        // Validate that all services are STI tests
        for (const serviceId of request.serviceIds) {
            if (!(await this.isStiTestService(serviceId))) {
                throw new BadRequestException(
                    `Service ${serviceId} không phải là xét nghiệm STI`,
                );
            }
        }

        // Calculate cost from services
        const services = await this.serviceRepository.findByIds(
            request.serviceIds,
        );
        const estimatedCost = services.reduce(
            (total, service) => total + Number(service.price),
            0,
        );

        // Tạo STI test process cho từng service
        const stiTestProcesses: StiTestProcessResponseDto[] = [];

        for (const serviceId of request.serviceIds) {
            const createDto: CreateStiTestProcessDto = {
                patientId: request.patientId,
                serviceId: serviceId,
                appointmentId: request.appointmentId,
                consultantDoctorId: request.consultantDoctorId,
                processNotes: request.notes,
                priority: ProcessPriority.NORMAL,
                sampleType: StiSampleType.BLOOD, // Default
            };

            const process =
                await this.stiTestProcessesService.create(createDto);
            stiTestProcesses.push(process);
        }

        return {
            stiTestProcesses: stiTestProcesses,
            estimatedCost: estimatedCost,
            estimatedDuration: '3-5 ngày', // Default duration
        };
    }

    /**
     * Kiểm tra xem service có phải là STI test không
     */
    async isStiTestService(serviceId: string): Promise<boolean> {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: {
                category: true,
            },
        });

        if (!service) {
            return false;
        }

        // Kiểm tra category type
        if (service.category?.type === 'test') {
            // Kiểm tra tên service có chứa từ khóa STI không
            const stiKeywords = [
                'sti',
                'std',
                'sexually transmitted',
                'hiv',
                'syphilis',
                'gonorrhea',
                'chlamydia',
                'herpes',
                'hpv',
                'hepatitis b',
                'hepatitis c',
            ];
            const serviceName = service.name.toLowerCase();
            const serviceDescription = service.description.toLowerCase();

            return stiKeywords.some(
                (keyword) =>
                    serviceName.includes(keyword) ||
                    serviceDescription.includes(keyword),
            );
        }

        return false;
    }

    /**
     * Lấy danh sách STI services có sẵn
     */
    async getAvailableStiServices(): Promise<Service[]> {
        const services = await this.serviceRepository.find({
            where: { isActive: true },
            relations: {
                category: true,
            },
        });

        const stiServices: Service[] = [];
        for (const service of services) {
            if (await this.isStiTestService(service.id)) {
                stiServices.push(service);
            }
        }

        return stiServices;
    }

    /**
     * Lấy danh sách STI services từ package
     * @param packageId - ID của package
     * @returns Danh sách ID của các service STI trong package
     * TODO: Implement this function
     */
    async getStiServicesFromPackage(packageId: string): Promise<string[]> {
        // Simple implementation - you can extend this later
        // For now, just return empty array as placeholder
        return [];
    }

    /**
     * Validate booking request
     */
    private validateBookingRequest(request: StiTestBookingRequest): void {
        if (!request.patientId) {
            throw new BadRequestException('Patient ID là bắt buộc');
        }

        if (!request.serviceIds || request.serviceIds.length === 0) {
            throw new BadRequestException('Cần chọn ít nhất một service');
        }
    }
}
