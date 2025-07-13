import { Injectable } from '@nestjs/common';
import {
    TestResultDataDto,
    TestResultItemDto,
} from '../dto/test-result-data.dto';
import { MeasurementUnit, ServiceType } from '../enums/test-result.enums';

@Injectable()
export class TestResultTemplateService {
    /**
     * Tạo template cho các loại xét nghiệm STI
     */
    createStiTestTemplate(): Partial<TestResultDataDto> {
        return {
            serviceType: ServiceType.STI_TEST,
            testName: 'Bộ xét nghiệm STI cơ bản',
            results: [
                {
                    parameterName: 'HIV',
                    displayName: 'HIV Antibody (Anti-HIV)',
                    category: 'Viral STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Non-reactive'],
                        description: 'Normal: Negative/Non-reactive',
                    },
                    status: 'normal',
                    methodUsed: 'ELISA',
                },
                {
                    parameterName: 'HBsAg',
                    displayName: 'Hepatitis B Surface Antigen',
                    category: 'Viral STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Non-reactive'],
                        description: 'Normal: Negative/Non-reactive',
                    },
                    status: 'normal',
                    methodUsed: 'ELISA',
                },
                {
                    parameterName: 'HCV',
                    displayName: 'Hepatitis C Antibody (Anti-HCV)',
                    category: 'Viral STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Non-reactive'],
                        description: 'Normal: Negative/Non-reactive',
                    },
                    status: 'normal',
                    methodUsed: 'ELISA',
                },
                {
                    parameterName: 'VDRL',
                    displayName: 'VDRL/RPR (Syphilis Screening)',
                    category: 'Bacterial STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Non-reactive'],
                        description: 'Normal: Negative/Non-reactive',
                    },
                    status: 'normal',
                    methodUsed: 'RPR',
                },
                {
                    parameterName: 'Chlamydia',
                    displayName: 'Chlamydia trachomatis',
                    category: 'Bacterial STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Not detected'],
                        description: 'Normal: Negative/Not detected',
                    },
                    status: 'normal',
                    methodUsed: 'PCR',
                },
                {
                    parameterName: 'Gonorrhea',
                    displayName: 'Neisseria gonorrhoeae',
                    category: 'Bacterial STI',
                    value: '',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Not detected'],
                        description: 'Normal: Negative/Not detected',
                    },
                    status: 'normal',
                    methodUsed: 'PCR',
                },
            ] as TestResultItemDto[],
            overallStatus: 'normal',
            sampleInfo: {
                type: 'Blood serum + Urine',
                condition: 'Good quality',
                collectionMethod: 'Standard collection',
            },
        };
    }

    /**
     * Tạo template cho xét nghiệm máu tổng quát
     */
    createBloodTestTemplate(): Partial<TestResultDataDto> {
        return {
            serviceType: ServiceType.BLOOD_TEST,
            testName: 'Xét nghiệm máu tổng quát',
            results: [
                {
                    parameterName: 'WBC',
                    displayName: 'Bạch cầu (White Blood Cell)',
                    category: 'Hematology',
                    value: 0,
                    unit: MeasurementUnit.THOUSAND_UL,
                    referenceRange: {
                        min: 4.0,
                        max: 11.0,
                        description: 'Normal: 4.0-11.0 thousand/μL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'RBC',
                    displayName: 'Hồng cầu (Red Blood Cell)',
                    category: 'Hematology',
                    value: 0,
                    unit: MeasurementUnit.MILLION_UL,
                    referenceRange: {
                        min: 4.5,
                        max: 5.5,
                        description: 'Normal: 4.5-5.5 million/μL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Hemoglobin',
                    displayName: 'Huyết sắc tố',
                    category: 'Hematology',
                    value: 0,
                    unit: MeasurementUnit.G_L,
                    referenceRange: {
                        min: 120,
                        max: 160,
                        description: 'Normal: 120-160 g/L',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Hematocrit',
                    displayName: 'Tỷ lệ thể tích hồng cầu',
                    category: 'Hematology',
                    value: 0,
                    unit: MeasurementUnit.PERCENT,
                    referenceRange: {
                        min: 36,
                        max: 48,
                        description: 'Normal: 36-48%',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Glucose',
                    displayName: 'Đường huyết',
                    category: 'Biochemistry',
                    value: 0,
                    unit: MeasurementUnit.MG_DL,
                    referenceRange: {
                        min: 70,
                        max: 100,
                        description: 'Normal: 70-100 mg/dL (fasting)',
                    },
                    status: 'normal',
                },
            ] as TestResultItemDto[],
            overallStatus: 'normal',
            sampleInfo: {
                type: 'Whole blood (EDTA)',
                condition: 'Good quality',
                volume: '5ml',
                collectionMethod: 'Venipuncture',
            },
        };
    }

    /**
     * Tạo template cho xét nghiệm nước tiểu
     */
    createUrineTestTemplate(): Partial<TestResultDataDto> {
        return {
            serviceType: ServiceType.URINE_TEST,
            testName: 'Xét nghiệm nước tiểu tổng quát',
            results: [
                {
                    parameterName: 'Color',
                    displayName: 'Màu sắc',
                    category: 'Physical Properties',
                    value: 'Yellow',
                    unit: MeasurementUnit.NONE,
                    referenceRange: {
                        normalValues: ['Yellow', 'Pale yellow'],
                        description: 'Normal: Yellow to pale yellow',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Clarity',
                    displayName: 'Độ trong',
                    category: 'Physical Properties',
                    value: 'Clear',
                    unit: MeasurementUnit.NONE,
                    referenceRange: {
                        normalValues: ['Clear', 'Slightly cloudy'],
                        description: 'Normal: Clear to slightly cloudy',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Protein',
                    displayName: 'Protein',
                    category: 'Chemical Analysis',
                    value: 'Negative',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative', 'Trace'],
                        description: 'Normal: Negative to trace',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Glucose',
                    displayName: 'Đường',
                    category: 'Chemical Analysis',
                    value: 'Negative',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative'],
                        description: 'Normal: Negative',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Ketones',
                    displayName: 'Ketone',
                    category: 'Chemical Analysis',
                    value: 'Negative',
                    unit: MeasurementUnit.NEGATIVE,
                    referenceRange: {
                        normalValues: ['Negative'],
                        description: 'Normal: Negative',
                    },
                    status: 'normal',
                },
            ] as TestResultItemDto[],
            overallStatus: 'normal',
            sampleInfo: {
                type: 'Mid-stream urine',
                condition: 'Fresh sample',
                volume: '50ml',
                collectionMethod: 'Clean catch',
            },
        };
    }

    /**
     * Tạo template cho xét nghiệm hormone
     */
    createHormoneTestTemplate(): Partial<TestResultDataDto> {
        return {
            serviceType: ServiceType.HORMONE_TEST,
            testName: 'Xét nghiệm hormone sinh dục',
            results: [
                {
                    parameterName: 'FSH',
                    displayName: 'Follicle Stimulating Hormone',
                    category: 'Reproductive Hormones',
                    value: 0,
                    unit: MeasurementUnit.IU_ML,
                    referenceRange: {
                        min: 1.5,
                        max: 12.4,
                        description:
                            'Normal (Follicular phase): 1.5-12.4 IU/mL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'LH',
                    displayName: 'Luteinizing Hormone',
                    category: 'Reproductive Hormones',
                    value: 0,
                    unit: MeasurementUnit.IU_ML,
                    referenceRange: {
                        min: 1.7,
                        max: 8.5,
                        description: 'Normal (Follicular phase): 1.7-8.5 IU/mL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Estradiol',
                    displayName: 'Estradiol (E2)',
                    category: 'Reproductive Hormones',
                    value: 0,
                    unit: MeasurementUnit.PG_ML,
                    referenceRange: {
                        min: 27,
                        max: 122,
                        description: 'Normal (Follicular phase): 27-122 pg/mL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Progesterone',
                    displayName: 'Progesterone',
                    category: 'Reproductive Hormones',
                    value: 0,
                    unit: MeasurementUnit.NG_ML,
                    referenceRange: {
                        min: 0.2,
                        max: 1.5,
                        description: 'Normal (Follicular phase): 0.2-1.5 ng/mL',
                    },
                    status: 'normal',
                },
                {
                    parameterName: 'Testosterone',
                    displayName: 'Testosterone',
                    category: 'Reproductive Hormones',
                    value: 0,
                    unit: MeasurementUnit.NG_ML,
                    referenceRange: {
                        min: 0.3,
                        max: 3.0,
                        description: 'Normal (Female): 0.3-3.0 ng/mL',
                    },
                    status: 'normal',
                },
            ] as TestResultItemDto[],
            overallStatus: 'normal',
            sampleInfo: {
                type: 'Blood serum',
                condition: 'Good quality',
                volume: '5ml',
                collectionMethod: 'Venipuncture',
            },
        };
    }

    /**
     * Lấy template theo loại dịch vụ
     */
    getTemplateByServiceType(
        serviceType: ServiceType,
    ): Partial<TestResultDataDto> {
        switch (serviceType) {
            case ServiceType.STI_TEST:
                return this.createStiTestTemplate();
            case ServiceType.BLOOD_TEST:
                return this.createBloodTestTemplate();
            case ServiceType.URINE_TEST:
                return this.createUrineTestTemplate();
            case ServiceType.HORMONE_TEST:
                return this.createHormoneTestTemplate();
            default:
                return {
                    serviceType,
                    testName: 'Custom Test',
                    results: [],
                    overallStatus: 'normal',
                };
        }
    }

    /**
     * Validate dữ liệu kết quả theo template
     */
    validateResultData(resultData: TestResultDataDto): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Kiểm tra các trường bắt buộc
        if (!resultData.serviceType) {
            errors.push('Service type is required');
        }
        if (!resultData.testName) {
            errors.push('Test name is required');
        }
        if (!resultData.results || resultData.results.length === 0) {
            errors.push('At least one test result is required');
        }
        if (!resultData.overallStatus) {
            errors.push('Overall status is required');
        }

        // Kiểm tra từng kết quả
        if (resultData.results) {
            resultData.results.forEach((result, index) => {
                if (!result.parameterName) {
                    errors.push(
                        `Result ${index + 1}: Parameter name is required`,
                    );
                }
                if (!result.displayName) {
                    errors.push(
                        `Result ${index + 1}: Display name is required`,
                    );
                }
                // Kiểm tra value: phải có value (cho phép empty string và số 0)
                if (result.value === undefined || result.value === null) {
                    errors.push(`Result ${index + 1}: Value is required`);
                }
                if (!result.unit) {
                    errors.push(`Result ${index + 1}: Unit is required`);
                }
                if (!result.status) {
                    errors.push(`Result ${index + 1}: Status is required`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Tự động đánh giá trạng thái dựa trên giá trị và tham chiếu
     */
    evaluateResultStatus(
        result: TestResultItemDto,
    ): 'normal' | 'abnormal' | 'borderline' | 'critical' {
        if (!result.referenceRange) {
            return 'normal'; // Mặc định nếu không có tham chiếu
        }

        const { value, referenceRange } = result;

        // Xử lý giá trị số
        if (
            typeof value === 'number' &&
            referenceRange.min !== undefined &&
            referenceRange.max !== undefined
        ) {
            if (value < referenceRange.min || value > referenceRange.max) {
                // Kiểm tra mức độ bất thường
                const deviation = Math.abs(
                    value - (referenceRange.min + referenceRange.max) / 2,
                );
                const range = referenceRange.max - referenceRange.min;

                if (deviation > range * 2) {
                    return 'critical';
                } else if (deviation > range) {
                    return 'abnormal';
                } else {
                    return 'borderline';
                }
            }
            return 'normal';
        }

        // Xử lý giá trị định tính
        if (typeof value === 'string' && referenceRange.normalValues) {
            const normalValues = referenceRange.normalValues.map((v) =>
                v.toLowerCase(),
            );
            const currentValue = value.toLowerCase();

            if (normalValues.includes(currentValue)) {
                return 'normal';
            } else {
                // Kiểm tra các giá trị nguy hiểm
                const criticalValues = [
                    'positive',
                    'reactive',
                    'detected',
                    'high positive',
                ];
                if (criticalValues.some((cv) => currentValue.includes(cv))) {
                    return 'critical';
                }
                return 'abnormal';
            }
        }

        return 'normal';
    }

    /**
     * Tự động tạo recommendations dựa trên kết quả
     */
    generateRecommendations(resultData: TestResultDataDto): string[] {
        const recommendations: string[] = [];
        const abnormalResults = resultData.results.filter(
            (r) => r.status !== 'normal',
        );

        if (abnormalResults.length === 0) {
            recommendations.push(
                'Tất cả các chỉ số trong giới hạn bình thường',
            );
            recommendations.push('Tiếp tục duy trì lối sống lành mạnh');
            return recommendations;
        }

        // Recommendations cho STI tests
        if (resultData.serviceType === ServiceType.STI_TEST) {
            const positiveTests = abnormalResults.filter(
                (r) =>
                    typeof r.value === 'string' &&
                    ['positive', 'reactive', 'detected'].some((term) =>
                        r.value.toString().toLowerCase().includes(term),
                    ),
            );

            if (positiveTests.length > 0) {
                recommendations.push(
                    'Cần tư vấn với bác sĩ chuyên khoa ngay lập tức',
                );
                recommendations.push(
                    'Thông báo cho bạn tình để được xét nghiệm',
                );
                recommendations.push(
                    'Tránh quan hệ tình dục cho đến khi được điều trị',
                );
                recommendations.push('Tuân thủ nghiêm ngặt phác đồ điều trị');
            }
        }

        // Recommendations cho blood tests
        if (resultData.serviceType === ServiceType.BLOOD_TEST) {
            const criticalResults = abnormalResults.filter(
                (r) => r.status === 'critical',
            );
            if (criticalResults.length > 0) {
                recommendations.push('Cần theo dõi y tế khẩn cấp');
                recommendations.push('Tái khám trong vòng 24-48 giờ');
            } else {
                recommendations.push('Tái khám theo lịch hẹn của bác sĩ');
                recommendations.push('Điều chỉnh chế độ ăn uống và sinh hoạt');
            }
        }

        return recommendations;
    }
}
