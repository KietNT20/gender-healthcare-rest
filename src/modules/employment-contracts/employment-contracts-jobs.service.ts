import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from 'src/constant';
import { ContractStatusType } from 'src/enums';
import { Between, LessThan, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmploymentContract } from './entities/employment-contract.entity';

@Injectable()
export class EmploymentContractJobsService {
    private readonly logger = new Logger(EmploymentContractJobsService.name);

    constructor(
        @InjectRepository(EmploymentContract)
        private readonly employmentContractRepository: Repository<EmploymentContract>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectQueue(QUEUE_NAMES.NOTIFICATION_QUEUE)
        private notificationQueue: Queue,
    ) {}

    /**
     * Tác vụ này sẽ chạy vào lúc 00:05 mỗi ngày.
     * Nó sẽ tìm tất cả các hợp đồng đang 'active' nhưng có ngày kết thúc (endDate)
     * đã qua và cập nhật trạng thái của chúng thành 'expired'.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
        name: 'handleExpiredContracts',
        timeZone: 'Asia/Ho_Chi_Minh',
    })
    async handleExpiredContracts() {
        try {
            const today = new Date();

            // Tìm các hợp đồng cần cập nhật
            const expiredContracts =
                await this.employmentContractRepository.find({
                    where: {
                        status: ContractStatusType.ACTIVE,
                        endDate: LessThan(today),
                    },
                });

            if (expiredContracts.length === 0) {
                this.logger.log('Không tìm thấy hợp đồng nào hết hạn.');
                return;
            }

            this.logger.log(
                `Tìm thấy ${expiredContracts.length} hợp đồng hết hạn. Đang cập nhật...`,
            );

            // Lấy ID của các hợp đồng để cập nhật
            const contractIds = expiredContracts.map((contract) => contract.id);

            // Cập nhật trạng thái thành 'expired'
            await this.employmentContractRepository.update(contractIds, {
                status: ContractStatusType.EXPIRED,
                updatedAt: new Date(),
            });

            this.logger.log(
                `Đã cập nhật thành công ${contractIds.length} hợp đồng.`,
            );
        } catch (error) {
            this.logger.error(
                'Đã xảy ra lỗi khi xử lý hợp đồng hết hạn:',
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Tác vụ này sẽ chạy vào lúc 05:10 mỗi ngày.
     * Nó sẽ tìm tất cả các hợp đồng đã ở trạng thái 'expired' hơn 7 ngày
     * và cập nhật trạng thái của chúng thành 'terminated'.
     */
    @Cron('10 5 * * *', {
        // Chạy vào 5h10 sáng mỗi ngày
        name: 'handleTerminatedContracts',
        timeZone: 'Asia/Ho_Chi_Minh',
    })
    async handleTerminatedContracts() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Tìm các hợp đồng cần chấm dứt
            // Điều kiện: status là EXPIRED và updatedAt (thời điểm chuyển sang expired) đã hơn 7 ngày
            const contractsToTerminate =
                await this.employmentContractRepository.find({
                    where: {
                        status: ContractStatusType.EXPIRED,
                        updatedAt: LessThan(sevenDaysAgo),
                    },
                });

            if (contractsToTerminate.length === 0) {
                this.logger.log('Không tìm thấy hợp đồng nào cần chấm dứt.');
                return;
            }

            this.logger.log(
                `Tìm thấy ${contractsToTerminate.length} hợp đồng cần chấm dứt. Đang cập nhật...`,
            );

            const contractIds = contractsToTerminate.map(
                (contract) => contract.id,
            );

            const updateResult = await this.employmentContractRepository.update(
                contractIds,
                {
                    status: ContractStatusType.TERMINATED,
                    updatedAt: new Date(),
                },
            );

            // Find users whose ALL employment contracts are TERMINATED
            // Step 1: Find user IDs who have contracts just terminated
            const affectedUserIds = [
                ...new Set(
                    contractsToTerminate.map((c) => c.user?.id).filter(Boolean),
                ),
            ];

            if (affectedUserIds.length === 0) {
                this.logger.log(
                    'Không có người dùng nào bị ảnh hưởng để kiểm tra trạng thái hợp đồng.',
                );
                this.logger.log(
                    `Đã chấm dứt thành công ${updateResult.affected} hợp đồng.`,
                );
                return;
            }

            // Step 2: For each user, check if they have any non-terminated contracts
            const usersToDeactivate: string[] = [];
            for (const userId of affectedUserIds) {
                const nonTerminatedCount =
                    await this.employmentContractRepository.count({
                        where: {
                            user: { id: userId },
                            status: Not(ContractStatusType.TERMINATED),
                        },
                    });
                if (nonTerminatedCount === 0) {
                    usersToDeactivate.push(userId);
                }
            }

            if (usersToDeactivate.length > 0) {
                await this.userRepository.update(usersToDeactivate, {
                    isActive: false,
                    updatedAt: new Date(),
                });
                this.logger.log(
                    `Đã chấm dứt thành công ${updateResult.affected} hợp đồng và vô hiệu hóa ${usersToDeactivate.length} người dùng.`,
                );
            } else {
                this.logger.log(
                    `Đã chấm dứt thành công ${updateResult.affected} hợp đồng. Không có người dùng nào bị vô hiệu hóa.`,
                );
            }
        } catch (error) {
            this.logger.error(
                'Đã xảy ra lỗi khi xử lý chấm dứt hợp đồng:',
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    /**
     * Tác vụ này sẽ chạy vào 08:00 mỗi ngày.
     * Tìm và gửi thông báo cho các hợp đồng sẽ hết hạn trong 7 ngày tới.
     */
    @Cron('0 8 * * *', {
        name: 'notifyUpcomingContractExpirations',
        timeZone: 'Asia/Ho_Chi_Minh',
    })
    async handleUpcomingContractExpirations() {
        try {
            const today = new Date();
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(today.getDate() + 7);

            // Tìm các hợp đồng sẽ hết hạn đúng 7 ngày nữa
            // Chúng ta cần tìm những hợp đồng có endDate bằng với `sevenDaysFromNow`
            // Để đơn giản, ta sẽ tìm trong khoảng 1 ngày của `sevenDaysFromNow`
            const startOfDay = new Date(sevenDaysFromNow);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(sevenDaysFromNow);
            endOfDay.setHours(23, 59, 59, 999);

            const upcomingContracts =
                await this.employmentContractRepository.find({
                    where: {
                        status: ContractStatusType.ACTIVE,
                        endDate: Between(startOfDay, endOfDay),
                    },
                    relations: {
                        user: true,
                    },
                });

            if (upcomingContracts.length === 0) {
                this.logger.log(
                    'Không có hợp đồng nào sắp hết hạn trong 7 ngày tới.',
                );
                return;
            }

            this.logger.log(
                `Tìm thấy ${upcomingContracts.length} hợp đồng sắp hết hạn. Đang tạo job thông báo...`,
            );

            for (const contract of upcomingContracts) {
                if (contract.user) {
                    const userName = `${contract.user.firstName} ${contract.user.lastName}`;
                    const endDateString = new Date(
                        contract.endDate!,
                    ).toLocaleDateString('vi-VN');

                    await this.notificationQueue.add(
                        'send-notification',
                        {
                            userId: contract.user.id,
                            email: contract.user.email,
                            userName: userName,
                            title: 'Thông báo: Hợp đồng sắp hết hạn',
                            content: `Hợp đồng lao động của bạn sẽ hết hạn vào ngày ${endDateString}. Vui lòng liên hệ bộ phận nhân sự để gia hạn.`,
                            type: 'CONTRACT_EXPIRING_REMINDER',
                        },
                        {
                            jobId: `contract-expiry-${contract.id}`, // ID duy nhất cho job
                            removeOnComplete: true,
                            removeOnFail: true,
                        },
                    );
                }
            }

            this.logger.log(
                `Đã tạo thành công ${upcomingContracts.length} job thông báo.`,
            );
        } catch (error) {
            this.logger.error(
                'Lỗi khi xử lý gửi thông báo hợp đồng sắp hết hạn:',
                error instanceof Error ? error.stack : undefined,
            );
        }
    }
}
