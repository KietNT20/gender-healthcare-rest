import { BadRequestException, Injectable } from '@nestjs/common';
import { StiTestProcessResponseDto } from '../dto/sti-test-process-response.dto';
import { ValidationDataDto } from '../dto/validation-data.dto';
import { StiTestProcess } from '../entities/sti-test-process.entity';
import { DeliveryMethod, StiTestProcessStatus } from '../enums';
import { StiTestProcessesService } from '../sti-test-processes.service';

export interface WorkflowStep {
    name: string;
    status: StiTestProcessStatus;
    description: string;
    nextSteps: StiTestProcessStatus[];
    requirements?: string[];
    estimatedDuration?: string;
}

export interface WorkflowStatistics {
    total: number; // Tổng số quá trình
    byStatus: Record<string, number>; // Số lượng theo từng trạng thái
    avgDurationByStep: Record<string, number>; // Thời gian trung bình cho từng bước
    bottlenecks: string[]; // Các bước có thể là bottleneck
}

@Injectable()
export class StiTestWorkflowService {
    private readonly workflow: Map<StiTestProcessStatus, WorkflowStep> =
        new Map([
            [
                StiTestProcessStatus.ORDERED,
                {
                    name: 'Đã đặt xét nghiệm',
                    status: StiTestProcessStatus.ORDERED,
                    description:
                        'Đơn xét nghiệm STI đã được tạo và chờ lên lịch lấy mẫu',
                    nextSteps: [
                        StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED,
                        StiTestProcessStatus.CANCELLED,
                    ],
                    requirements: [
                        'Thông tin bệnh nhân đầy đủ',
                        'Dịch vụ được chọn',
                    ],
                    estimatedDuration: '0',
                },
            ],
            [
                StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED,
                {
                    name: 'Đã lên lịch lấy mẫu',
                    status: StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED,
                    description: 'Đã lên lịch cuộc hẹn để lấy mẫu xét nghiệm',
                    nextSteps: [
                        StiTestProcessStatus.SAMPLE_COLLECTED,
                        StiTestProcessStatus.CANCELLED,
                    ],
                    requirements: ['Cuộc hẹn được đặt', 'Bệnh nhân xác nhận'],
                    estimatedDuration: '24-48',
                },
            ],
            [
                StiTestProcessStatus.SAMPLE_COLLECTED,
                {
                    name: 'Đã lấy mẫu',
                    status: StiTestProcessStatus.SAMPLE_COLLECTED,
                    description: 'Mẫu xét nghiệm đã được thu thập thành công',
                    nextSteps: [StiTestProcessStatus.PROCESSING],
                    requirements: [
                        'Mẫu chất lượng tốt',
                        'Thông tin người lấy mẫu',
                        'Nhãn mẫu chính xác',
                    ],
                    estimatedDuration: '1',
                },
            ],
            [
                StiTestProcessStatus.PROCESSING,
                {
                    name: 'Đang xử lý',
                    status: StiTestProcessStatus.PROCESSING,
                    description: 'Mẫu đang được phân tích tại phòng lab',
                    nextSteps: [StiTestProcessStatus.RESULT_READY],
                    requirements: [
                        'Mẫu đã chuyển đến lab',
                        'Lab xác nhận nhận mẫu',
                    ],
                    estimatedDuration: '24-72',
                },
            ],
            [
                StiTestProcessStatus.RESULT_READY,
                {
                    name: 'Kết quả sẵn sàng',
                    status: StiTestProcessStatus.RESULT_READY,
                    description:
                        'Kết quả xét nghiệm đã hoàn thành và chờ giao cho bệnh nhân',
                    nextSteps: [
                        StiTestProcessStatus.RESULT_DELIVERED,
                        StiTestProcessStatus.CONSULTATION_REQUIRED,
                    ],
                    requirements: [
                        'Kết quả đã được kiểm tra',
                        'Báo cáo hoàn thành',
                    ],
                    estimatedDuration: '1',
                },
            ],
            [
                StiTestProcessStatus.RESULT_DELIVERED,
                {
                    name: 'Đã giao kết quả',
                    status: StiTestProcessStatus.RESULT_DELIVERED,
                    description: 'Kết quả đã được giao cho bệnh nhân',
                    nextSteps: [
                        StiTestProcessStatus.CONSULTATION_REQUIRED,
                        StiTestProcessStatus.FOLLOW_UP_SCHEDULED,
                        StiTestProcessStatus.COMPLETED,
                    ],
                    requirements: [
                        'Bệnh nhân đã nhận kết quả',
                        'Xác nhận giao kết quả',
                    ],
                    estimatedDuration: '0',
                },
            ],
            [
                StiTestProcessStatus.CONSULTATION_REQUIRED,
                {
                    name: 'Cần tư vấn',
                    status: StiTestProcessStatus.CONSULTATION_REQUIRED,
                    description:
                        'Kết quả cần tư vấn thêm từ bác sĩ chuyên khoa',
                    nextSteps: [
                        StiTestProcessStatus.FOLLOW_UP_SCHEDULED,
                        StiTestProcessStatus.COMPLETED,
                    ],
                    requirements: [
                        'Bác sĩ tư vấn được chỉ định',
                        'Lịch tư vấn được sắp xếp',
                    ],
                    estimatedDuration: '24-48',
                },
            ],
            [
                StiTestProcessStatus.FOLLOW_UP_SCHEDULED,
                {
                    name: 'Đã lên lịch theo dõi',
                    status: StiTestProcessStatus.FOLLOW_UP_SCHEDULED,
                    description: 'Đã lên lịch các cuộc hẹn theo dõi cần thiết',
                    nextSteps: [StiTestProcessStatus.COMPLETED],
                    requirements: [
                        'Lịch theo dõi được xác nhận',
                        'Hướng dẫn điều trị',
                    ],
                    estimatedDuration: '1',
                },
            ],
            [
                StiTestProcessStatus.COMPLETED,
                {
                    name: 'Hoàn thành',
                    status: StiTestProcessStatus.COMPLETED,
                    description: 'Quá trình xét nghiệm đã hoàn thành toàn bộ',
                    nextSteps: [],
                    requirements: [
                        'Tất cả bước đã hoàn thành',
                        'Bệnh nhân hài lòng',
                    ],
                    estimatedDuration: '0',
                },
            ],
            [
                StiTestProcessStatus.CANCELLED,
                {
                    name: 'Đã hủy',
                    status: StiTestProcessStatus.CANCELLED,
                    description: 'Quá trình xét nghiệm đã bị hủy',
                    nextSteps: [],
                    requirements: [
                        'Lý do hủy rõ ràng',
                        'Thông báo cho bệnh nhân',
                    ],
                    estimatedDuration: '0',
                },
            ],
        ]);

    constructor(
        private readonly stiTestProcessesService: StiTestProcessesService,
    ) {}

    /**
     * Lấy thông tin workflow step theo status
     */
    getWorkflowStep(status: StiTestProcessStatus): WorkflowStep | undefined {
        return this.workflow.get(status);
    }

    /**
     * Lấy toàn bộ workflow
     */
    getFullWorkflow(): WorkflowStep[] {
        return Array.from(this.workflow.values());
    }

    /**
     * Kiểm tra xem có thể chuyển từ status này sang status khác không
     */
    canTransitionTo(
        currentStatus: StiTestProcessStatus,
        nextStatus: StiTestProcessStatus,
    ): boolean {
        const currentStep = this.workflow.get(currentStatus);
        return currentStep ? currentStep.nextSteps.includes(nextStatus) : false;
    }

    /**
     * Lấy các bước tiếp theo có thể thực hiện
     */
    getNextSteps(currentStatus: StiTestProcessStatus): WorkflowStep[] {
        const currentStep = this.workflow.get(currentStatus);
        if (!currentStep) return [];

        return currentStep.nextSteps
            .map((status) => this.workflow.get(status))
            .filter((step): step is WorkflowStep => step !== undefined);
    }

    /**
     * Chuyển đổi trạng thái với kiểm tra workflow
     */
    async transitionStatus(
        processId: string,
        newStatus: StiTestProcessStatus,
        validationData?: ValidationDataDto,
    ): Promise<StiTestProcessResponseDto> {
        // Lấy thông tin process hiện tại
        const currentProcess =
            await this.stiTestProcessesService.findById(processId);

        // Kiểm tra xem có thể chuyển đổi không
        if (!this.canTransitionTo(currentProcess.status, newStatus)) {
            throw new BadRequestException(
                `Không thể chuyển từ trạng thái "${currentProcess.status}" sang "${newStatus}"`,
            );
        }

        // Thực hiện validation cho bước mới (nếu cần)
        this.validateTransition(
            currentProcess.status,
            newStatus,
            validationData,
        );

        // Thực hiện chuyển đổi
        return await this.stiTestProcessesService.updateStatus(
            processId,
            newStatus,
        );
    }

    /**
     * Validation cho việc chuyển đổi trạng thái
     */
    private validateTransition(
        currentStatus: StiTestProcessStatus,
        newStatus: StiTestProcessStatus,
        validationData?: ValidationDataDto,
    ): void {
        const targetStep = this.workflow.get(newStatus);
        if (!targetStep) return;

        // Kiểm tra xem có thể chuyển đổi từ trạng thái hiện tại không
        if (!this.canTransitionTo(currentStatus, newStatus)) {
            throw new BadRequestException(
                `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}"`,
            );
        } // Validation tùy theo từng bước
        switch (newStatus) {
            case StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED:
                this.validateSampleCollectionScheduled(validationData);
                break;

            case StiTestProcessStatus.SAMPLE_COLLECTED:
                this.validateSampleCollected(validationData);
                break;

            case StiTestProcessStatus.PROCESSING:
                this.validateProcessing(validationData);
                break;

            case StiTestProcessStatus.RESULT_READY:
                this.validateResultReady(validationData);
                break;

            case StiTestProcessStatus.RESULT_DELIVERED:
                this.validateResultDelivered(validationData);
                break;

            case StiTestProcessStatus.CONSULTATION_REQUIRED:
                this.validateConsultationRequired(validationData);
                break;

            case StiTestProcessStatus.FOLLOW_UP_SCHEDULED:
                this.validateFollowUpScheduled(validationData);
                break;

            case StiTestProcessStatus.CANCELLED:
                this.validateCancelled(validationData);
                break;

            default:
                // Không cần validation đặc biệt
                break;
        }
    }

    /**
     * Validate cho SAMPLE_COLLECTION_SCHEDULED
     */
    private validateSampleCollectionScheduled(
        validationData?: ValidationDataDto,
    ): void {
        this.validateRequiredFields(
            validationData,
            ['appointmentId'],
            'Lên lịch lấy mẫu',
        );
    }

    /**
     * Validate cho SAMPLE_COLLECTED
     */
    private validateSampleCollected(validationData?: ValidationDataDto): void {
        this.validateRequiredFields(
            validationData,
            ['sampleCollectedBy', 'sampleCollectionDate'],
            'Lấy mẫu',
        );
        this.validateSpecialFormats(validationData);
    }

    /**
     * Validate cho PROCESSING
     */
    private validateProcessing(validationData?: ValidationDataDto): void {
        if (!validationData?.labProcessedBy) {
            throw new BadRequestException('Cần thông tin lab xử lý');
        }
        // Optional: Validate lab batch number format
        if (
            validationData?.labBatchNumber &&
            !/^[A-Z0-9]{6,}$/.test(validationData.labBatchNumber)
        ) {
            throw new BadRequestException(
                'Số batch lab không đúng định dạng (ít nhất 6 ký tự chữ/số)',
            );
        }
    }

    /**
     * Validate cho RESULT_READY
     */
    private validateResultReady(validationData?: ValidationDataDto): void {
        if (!validationData?.testResultId) {
            throw new BadRequestException('Cần có kết quả xét nghiệm');
        }
        if (!validationData?.resultValidatedBy) {
            throw new BadRequestException(
                'Cần thông tin người validate kết quả',
            );
        }
    }

    /**
     * Validate cho RESULT_DELIVERED
     */
    private validateResultDelivered(validationData?: ValidationDataDto): void {
        this.validateRequiredFields(
            validationData,
            ['deliveredToPatient', 'deliveryMethod', 'deliveredBy'],
            'Giao kết quả',
        );
        this.validateSpecialFormats(validationData);
    }

    /**
     * Validate cho CONSULTATION_REQUIRED
     */
    private validateConsultationRequired(
        validationData?: ValidationDataDto,
    ): void {
        if (!validationData?.consultantDoctorId) {
            throw new BadRequestException('Cần chỉ định bác sĩ tư vấn');
        }
        if (!validationData?.consultationReason) {
            throw new BadRequestException('Cần lý do tư vấn');
        }
    }

    /**
     * Validate cho FOLLOW_UP_SCHEDULED
     */
    private validateFollowUpScheduled(
        validationData?: ValidationDataDto,
    ): void {
        if (!validationData?.followUpAppointmentId) {
            throw new BadRequestException('Cần ID cuộc hẹn theo dõi');
        }
        if (!validationData?.followUpType) {
            throw new BadRequestException('Cần chỉ định loại theo dõi');
        }
        if (!validationData?.followUpDate) {
            throw new BadRequestException('Cần thời gian theo dõi');
        }
    }

    /**
     * Validate cho CANCELLED
     */
    private validateCancelled(validationData?: ValidationDataDto): void {
        if (!validationData?.cancellationReason) {
            throw new BadRequestException('Cần lý do hủy');
        }
        if (!validationData?.cancelledBy) {
            throw new BadRequestException('Cần thông tin người hủy');
        }
        // Auto-set cancellation date if not provided
        if (!validationData?.cancellationDate) {
            validationData.cancellationDate = new Date();
        }
    }

    /**
     * Utility method để validate ValidationDataDto
     */
    private validateRequiredFields(
        data: ValidationDataDto | undefined,
        requiredFields: string[],
        context: string,
    ): void {
        const missingFields = requiredFields.filter((field) => !data?.[field]);

        if (missingFields.length > 0) {
            throw new BadRequestException(
                `${context}: Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
            );
        }
    }

    /**
     * Validate format các trường đặc biệt
     */
    private validateSpecialFormats(validationData?: ValidationDataDto): void {
        // Validate email format if delivery method is email
        if (
            validationData?.deliveryMethod === DeliveryMethod.EMAIL &&
            validationData?.deliveredBy
        ) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(validationData.deliveredBy)) {
                throw new BadRequestException(
                    'Email người giao kết quả không đúng định dạng',
                );
            }
        }

        // Validate date is not in the future for collection/delivery dates
        const now = new Date();
        if (validationData?.sampleCollectionDate) {
            const collectionDate = new Date(
                validationData.sampleCollectionDate,
            );
            if (collectionDate > now) {
                throw new BadRequestException(
                    'Thời gian lấy mẫu không thể trong tương lai',
                );
            }
        }

        if (validationData?.deliveryDate) {
            const deliveryDate = new Date(validationData.deliveryDate);
            if (deliveryDate > now) {
                throw new BadRequestException(
                    'Thời gian giao kết quả không thể trong tương lai',
                );
            }
        }

        // Validate follow-up date is in the future
        if (validationData?.followUpDate) {
            const followUpDate = new Date(validationData.followUpDate);
            if (followUpDate <= now) {
                throw new BadRequestException(
                    'Thời gian theo dõi phải trong tương lai',
                );
            }
        }
    }

    /**
     * Lấy thời gian ước tính cho toàn bộ quá trình
     */
    getEstimatedTotalDuration(
        startStatus: StiTestProcessStatus = StiTestProcessStatus.ORDERED,
        endStatus: StiTestProcessStatus = StiTestProcessStatus.COMPLETED,
    ): string {
        const path = this.findShortestPath(startStatus, endStatus);
        if (!path.length) return 'Không xác định';

        let totalHours = 0;
        for (const status of path) {
            const step = this.workflow.get(status);
            if (step?.estimatedDuration) {
                const duration = step.estimatedDuration;
                if (duration.includes('-')) {
                    // Lấy giá trị trung bình
                    const [min, max] = duration.split('-').map(Number);
                    totalHours += (min + max) / 2;
                } else {
                    totalHours += Number(duration);
                }
            }
        }

        if (totalHours < 24) {
            return `${totalHours} giờ`;
        } else {
            const days = Math.ceil(totalHours / 24);
            return `${days} ngày`;
        }
    }

    /**
     * Tìm đường đi ngắn nhất giữa hai trạng thái
     */
    private findShortestPath(
        start: StiTestProcessStatus,
        end: StiTestProcessStatus,
    ): StiTestProcessStatus[] {
        const visited = new Set<StiTestProcessStatus>();
        const queue: {
            status: StiTestProcessStatus;
            path: StiTestProcessStatus[];
        }[] = [{ status: start, path: [start] }];

        while (queue.length > 0) {
            const { status, path } = queue.shift()!;

            if (status === end) {
                return path;
            }

            if (visited.has(status)) continue;
            visited.add(status);

            const currentStep = this.workflow.get(status);
            if (currentStep) {
                for (const nextStatus of currentStep.nextSteps) {
                    if (!visited.has(nextStatus)) {
                        queue.push({
                            status: nextStatus,
                            path: [...path, nextStatus],
                        });
                    }
                }
            }
        }

        return []; // Không tìm thấy đường đi
    }

    /**
     * Lấy thống kê workflow cho dashboard
     */
    getWorkflowStatistics(processes: StiTestProcess[]): WorkflowStatistics {
        const statistics: WorkflowStatistics = {
            total: processes.length,
            byStatus: {},
            avgDurationByStep: {},
            bottlenecks: [],
        };

        // Đếm theo trạng thái
        for (const process of processes) {
            const status = process.status;
            statistics.byStatus[status] =
                (statistics.byStatus[status] || 0) + 1;
        }

        // Tìm bottleneck (trạng thái có nhiều process bị kẹt)
        const maxCount = Math.max(...Object.values(statistics.byStatus));
        for (const [status, count] of Object.entries(statistics.byStatus)) {
            if (count === maxCount && count > processes.length * 0.3) {
                const step = this.workflow.get(status as StiTestProcessStatus);
                if (step) {
                    statistics.bottlenecks.push(step.name);
                }
            }
        }

        return statistics;
    }
}
