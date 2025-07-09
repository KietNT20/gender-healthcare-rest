import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackageService } from '../package-services/entities/package-service.entity';
import { Service } from '../services/entities/service.entity';
import { UsersService } from '../users/users.service';
import { CreateStiTestProcessDto } from './dto/create-sti-test-process.dto';
import { StiTestBookingRequest } from './dto/sti-test-booking-request.dto';
import { StiTestProcessResponseDto } from './dto/sti-test-process-response.dto';
import { ProcessPriority, StiSampleType } from './enums';
import { StiTestProcessesService } from './sti-test-processes.service';

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
        @InjectRepository(PackageService)
        private readonly packageServiceRepository: Repository<PackageService>,
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

        // Get service IDs from either direct serviceIds or servicePackageId
        let serviceIds: string[] = [];
        if (request.serviceIds && request.serviceIds.length > 0) {
            serviceIds = request.serviceIds;
        } else if (request.servicePackageId) {
            serviceIds = await this.getStiServicesFromPackage(
                request.servicePackageId,
            );
        }

        // Validate that all services are STI tests
        for (const serviceId of serviceIds) {
            if (!(await this.isStiTestService(serviceId))) {
                throw new BadRequestException(
                    `Service ${serviceId} không phải là xét nghiệm STI`,
                );
            }
        }

        // Calculate cost from services
        const services = await this.serviceRepository.findByIds(serviceIds);
        const estimatedCost = services.reduce(
            (total, service) => total + Number(service.price),
            0,
        );

        // Tạo STI test process cho từng service
        const stiTestProcesses: StiTestProcessResponseDto[] = [];

        for (const serviceId of serviceIds) {
            const createDto: CreateStiTestProcessDto = {
                patientId: request.patientId,
                serviceId: serviceId,
                appointmentId: request.appointmentId,
                consultantDoctorId: request.consultantId,
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
        if (service.category?.type === 'sti_test') {
            // Kiểm tra tên service có chứa từ khóa STI không
            const stiKeywords = [
                'sti',
                'std',
                'sexually transmitted',
                'hiv',
                'syphilis',
                'scabies',
                'gonorrhea',
                'chlamydia',
                'herpes',
                'genital warts',
                'hpv',
                'hepatitis a',
                'hepatitis b',
                'hepatitis c',
                'bacterial vaginosis',
                'lymphogranuloma venereum',
                'thrush',
                'trichomonas',
                'urethritis',
                'urinary tract infections',
                'pubic lice',
                'pep',
                'prep',
                'pelvic inflammatory disease',
                'mycoplasma genitalium',
                'mpox',
                'molluscum contagiosum',
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
     */
    async getStiServicesFromPackage(packageId: string): Promise<string[]> {
        try {
            // Lấy danh sách services trong package
            const packageServices = await this.packageServiceRepository.find({
                where: {
                    servicePackage: { id: packageId },
                },
                relations: {
                    service: true,
                },
            });

            const stiServiceIds: string[] = [];

            // Kiểm tra từng service xem có phải STI test không
            for (const packageService of packageServices) {
                if (
                    packageService.service &&
                    (await this.isStiTestService(packageService.service.id))
                ) {
                    stiServiceIds.push(packageService.service.id);
                }
            }

            return stiServiceIds;
        } catch (error) {
            console.error('Error getting STI services from package:', error);
            return [];
        }
    }

    /**
     * Validate booking request
     */
    private validateBookingRequest(request: StiTestBookingRequest): void {
        if (!request.patientId) {
            throw new BadRequestException('Patient ID là bắt buộc');
        }

        // Phải có ít nhất một trong hai: serviceIds hoặc servicePackageId
        const hasServiceIds =
            request.serviceIds && request.serviceIds.length > 0;
        const hasServicePackageId = request.servicePackageId;

        if (!hasServiceIds && !hasServicePackageId) {
            throw new BadRequestException(
                'Cần chọn ít nhất một service hoặc một service package',
            );
        }
    }
}
