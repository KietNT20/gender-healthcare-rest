import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { TestResultResponseDto } from '../dto/test-result-response.dto';
import { TestResult } from '../entities/test-result.entity';

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
     * Validate và normalize dữ liệu resultData trước khi lưu vào database
     */
    normalizeResultData(resultData: any): any {
        // Ensure all required fields are present
        const normalized = {
            serviceType: resultData.serviceType,
            testName: resultData.testName || 'Unknown Test',
            testCode: resultData.testCode,
            sampleCollectedAt: resultData.sampleCollectedAt
                ? new Date(resultData.sampleCollectedAt)
                : undefined,
            analyzedAt: resultData.analyzedAt
                ? new Date(resultData.analyzedAt)
                : undefined,
            reportedAt: resultData.reportedAt
                ? new Date(resultData.reportedAt)
                : new Date(),
            sampleInfo: resultData.sampleInfo,
            results: resultData.results || [],
            overallStatus: resultData.overallStatus || 'inconclusive',
            summary: resultData.summary,
            clinicalInterpretation: resultData.clinicalInterpretation,
            recommendations: resultData.recommendations || [],
            laboratoryInfo: resultData.laboratoryInfo,
            qualityControl: resultData.qualityControl,
        };

        // Remove undefined fields
        Object.keys(normalized).forEach((key) => {
            if (normalized[key] === undefined) {
                delete normalized[key];
            }
        });

        return normalized;
    }

    /**
     * Tính toán các field summary từ resultData
     */
    calculateSummaryFields(resultData: any): {
        isAbnormal: boolean;
        resultSummary: string;
        followUpRequired: boolean;
    } {
        const hasAbnormalResults = resultData.results?.some(
            (result: any) =>
                result.status === 'abnormal' || result.status === 'critical',
        );

        const hasCriticalResults = resultData.results?.some(
            (result: any) => result.status === 'critical',
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

    private generateResultSummary(resultData: any): string {
        if (resultData.summary) {
            return resultData.summary;
        }

        const abnormalCount =
            resultData.results?.filter(
                (result: any) =>
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
}
