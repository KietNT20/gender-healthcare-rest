import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { TestResultResponseDto } from '../dto/test-result-response.dto';
import { TestResult } from '../entities/test-result.entity';
import { TestResultData } from '../interfaces/test-result.interfaces';

@Injectable()
export class TestResultMapperService {
    /**
     * Chuyển đổi TestResult entity thành response DTO chuẩn hóa cho frontend
     */
    toResponseDto(testResult: TestResult): TestResultResponseDto {
        const response = plainToClass(TestResultResponseDto, testResult, {
            excludeExtraneousValues: true,
        });

        // Map appointment data if available
        if (testResult.appointment) {
            response.appointment = {
                id: testResult.appointment.id,
                appointmentDate: testResult.appointment.appointmentDate,
                status: testResult.appointment.status,
            };
        } // Map service data if available
        if (testResult.service) {
            response.service = {
                id: testResult.service.id,
                name: testResult.service.name,
                category:
                    testResult.service.category?.name || 'Unknown Category',
            };
        }

        // Map user data if available
        if (testResult.user) {
            response.user = {
                id: testResult.user.id,
                email: testResult.user.email,
                firstName: testResult.user.firstName,
                lastName: testResult.user.lastName,
            };
        }

        return response;
    }

    /**
     * Chuyển đổi array TestResult entities thành response DTOs
     */
    toResponseDtos(testResults: TestResult[]): TestResultResponseDto[] {
        return testResults.map((testResult) => this.toResponseDto(testResult));
    }

    /**
     * Tính toán các field summary từ resultData
     */
    calculateSummaryFields(resultData: TestResultData): {
        isAbnormal: boolean;
        resultSummary: string;
        followUpRequired: boolean;
    } {
        const hasAbnormalResults = resultData.results?.some(
            (result) =>
                result.status === 'abnormal' || result.status === 'critical',
        );

        const hasCriticalResults = resultData.results?.some(
            (result) => result.status === 'critical',
        );

        return {
            isAbnormal:
                hasAbnormalResults ||
                resultData.overallStatus === 'abnormal' ||
                resultData.overallStatus === 'critical',
            resultSummary: this.generateResultSummary(resultData),
            followUpRequired:
                hasCriticalResults || resultData.overallStatus === 'critical',
        };
    }

    private generateResultSummary(resultData: TestResultData): string {
        if (resultData.summary) {
            return resultData.summary;
        }

        const abnormalCount =
            resultData.results?.filter(
                (result) =>
                    result.status === 'abnormal' ||
                    result.status === 'critical',
            ).length || 0;

        const totalCount = resultData.results?.length || 0;

        if (abnormalCount === 0) {
            return 'Tất cả các chỉ số trong giới hạn bình thường';
        } else if (abnormalCount === totalCount) {
            return 'Tất cả các chỉ số bất thường, cần theo dõi';
        } else {
            return `${abnormalCount}/${totalCount} chỉ số bất thường`;
        }
    }

    /**
     * Get summary statistics from test results
     */
    getResultStatistics(results: TestResultData['results']): {
        total: number;
        normal: number;
        abnormal: number;
        critical: number;
        borderline: number;
    } {
        if (!Array.isArray(results)) {
            return {
                total: 0,
                normal: 0,
                abnormal: 0,
                critical: 0,
                borderline: 0,
            };
        }

        return results.reduce(
            (stats, result) => {
                stats.total++;
                stats[result.status]++;
                return stats;
            },
            { total: 0, normal: 0, abnormal: 0, critical: 0, borderline: 0 },
        );
    }
}
