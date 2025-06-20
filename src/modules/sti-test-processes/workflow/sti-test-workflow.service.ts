import { Injectable } from '@nestjs/common';
import { StiTestProcessStatus } from '../entities/sti-test-process.entity';
import { StiTestProcessesService } from '../sti-test-processes.service';

export interface WorkflowStep {
    name: string;
    status: StiTestProcessStatus;
    description: string;
    nextSteps: StiTestProcessStatus[];
    requirements?: string[];
    estimatedDuration?: string;
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
        validationData?: any,
    ): Promise<any> {
        // Lấy thông tin process hiện tại
        const currentProcess =
            await this.stiTestProcessesService.findById(processId);

        // Kiểm tra xem có thể chuyển đổi không
        if (!this.canTransitionTo(currentProcess.status, newStatus)) {
            throw new Error(
                `Không thể chuyển từ trạng thái "${currentProcess.status}" sang "${newStatus}"`,
            );
        }

        // Thực hiện validation cho bước mới (nếu cần)
        await this.validateTransition(
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
    private async validateTransition(
        currentStatus: StiTestProcessStatus,
        newStatus: StiTestProcessStatus,
        validationData?: any,
    ): Promise<void> {
        const targetStep = this.workflow.get(newStatus);
        if (!targetStep) return;

        // Validation tùy theo từng bước
        switch (newStatus) {
            case StiTestProcessStatus.SAMPLE_COLLECTION_SCHEDULED:
                if (!validationData?.appointmentId) {
                    throw new Error('Cần có ID cuộc hẹn để lên lịch lấy mẫu');
                }
                break;

            case StiTestProcessStatus.SAMPLE_COLLECTED:
                if (!validationData?.sampleCollectedBy) {
                    throw new Error('Cần thông tin người lấy mẫu');
                }
                if (!validationData?.sampleCollectionDate) {
                    throw new Error('Cần thời gian lấy mẫu');
                }
                break;

            case StiTestProcessStatus.PROCESSING:
                if (!validationData?.labProcessedBy) {
                    throw new Error('Cần thông tin lab xử lý');
                }
                break;

            case StiTestProcessStatus.RESULT_READY:
                if (!validationData?.testResultId) {
                    throw new Error('Cần có kết quả xét nghiệm');
                }
                break;

            case StiTestProcessStatus.CONSULTATION_REQUIRED:
                if (!validationData?.consultantDoctorId) {
                    throw new Error('Cần chỉ định bác sĩ tư vấn');
                }
                break;

            default:
                // Không cần validation đặc biệt
                break;
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
    getWorkflowStatistics(processes: any[]): any {
        const statistics = {
            total: processes.length,
            byStatus: {} as Record<string, number>,
            avgDurationByStep: {} as Record<string, number>,
            bottlenecks: [] as string[],
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
