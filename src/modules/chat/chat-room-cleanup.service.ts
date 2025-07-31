import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisClientType } from 'redis';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { AppointmentStatusType } from '../../enums';
import { REDIS_KEYS } from './constants/chat.constants';
import { Question } from './entities/question.entity';

@Injectable()
export class ChatRoomCleanupService {
    private readonly logger = new Logger(ChatRoomCleanupService.name);

    constructor(
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @Inject('REDIS_CLIENT') private redisClient: RedisClientType,
    ) {}

    /**
     * Clean up chat rooms for completed appointments older than 30 days
     */
    async cleanupCompletedConsultationRooms(): Promise<number> {
        try {
            this.logger.log(
                'Starting cleanup of completed consultation chat rooms...',
            );

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Find questions linked to completed appointments older than 30 days
            const completedQuestions = await this.questionRepository.find({
                where: {
                    appointment: {
                        status: AppointmentStatusType.COMPLETED,
                        updatedAt: LessThan(thirtyDaysAgo),
                    },
                },
                relations: {
                    appointment: true,
                },
            });

            let cleanupCount = 0;

            for (const question of completedQuestions) {
                try {
                    await this.cleanupQuestionRoom(question.id);
                    cleanupCount++;

                    this.logger.debug(
                        `Cleaned up completed consultation room: ${question.id} (appointment: ${question.appointment?.id})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up question room ${question.id}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Completed consultation rooms cleanup finished. Cleaned up ${cleanupCount} rooms`,
            );
            return cleanupCount;
        } catch (error) {
            this.logger.error(
                'Error during completed consultation rooms cleanup:',
                error,
            );
            throw error;
        }
    }

    /**
     * Clean up chat rooms for cancelled appointments older than 7 days
     */
    async cleanupCancelledConsultationRooms(): Promise<number> {
        try {
            this.logger.log(
                'Starting cleanup of cancelled consultation chat rooms...',
            );

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Find questions linked to cancelled appointments older than 7 days
            const cancelledQuestions = await this.questionRepository.find({
                where: {
                    appointment: {
                        status: In([
                            AppointmentStatusType.CANCELLED,
                            AppointmentStatusType.NO_SHOW,
                        ]),
                        updatedAt: LessThan(sevenDaysAgo),
                    },
                },
                relations: {
                    appointment: true,
                },
            });

            let cleanupCount = 0;

            for (const question of cancelledQuestions) {
                try {
                    await this.cleanupQuestionRoom(question.id);
                    cleanupCount++;

                    this.logger.debug(
                        `Cleaned up cancelled consultation room: ${question.id} (appointment: ${question.appointment?.id})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up question room ${question.id}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Cancelled consultation rooms cleanup finished. Cleaned up ${cleanupCount} rooms`,
            );
            return cleanupCount;
        } catch (error) {
            this.logger.error(
                'Error during cancelled consultation rooms cleanup:',
                error,
            );
            throw error;
        }
    }

    /**
     * Clean up specific question room data from Redis
     */
    private async cleanupQuestionRoom(questionId: string): Promise<void> {
        const multi = this.redisClient.multi();

        // Remove all Redis data related to this question room
        multi.del(`${REDIS_KEYS.QUESTION_USERS}${questionId}`);
        multi.del(`${REDIS_KEYS.TYPING_USERS}${questionId}`);

        // Remove this question from all user rooms
        const userRoomsPattern = `${REDIS_KEYS.USER_ROOMS}*`;
        const userRoomKeys = await this.scanKeys(userRoomsPattern);

        for (const userRoomKey of userRoomKeys) {
            multi.sRem(userRoomKey, questionId);
        }

        // Clean up individual typing statuses for this question
        const typingPattern = `${REDIS_KEYS.TYPING_USERS}${questionId}:*`;
        const typingKeys = await this.scanKeys(typingPattern);

        for (const typingKey of typingKeys) {
            multi.del(typingKey);
        }

        await multi.exec();
    }

    /**
     * Helper function to scan for keys using a pattern without blocking the server.
     */
    private async scanKeys(pattern: string): Promise<string[]> {
        const foundKeys: string[] = [];
        let cursor = 0;

        do {
            const reply = await this.redisClient.scan(cursor, {
                MATCH: pattern,
                COUNT: 100, // Process 100 keys per iteration
            });
            cursor = reply.cursor;
            foundKeys.push(...reply.keys);
        } while (cursor !== 0);

        return foundKeys;
    }

    /**
     * Archive old questions instead of deleting them completely
     * This marks questions as deleted but keeps them in database for audit purposes
     */
    async archiveOldQuestions(): Promise<number> {
        try {
            this.logger.log('Starting archival of old questions...');

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            // Find questions older than 6 months from completed/cancelled appointments
            const oldQuestions = await this.questionRepository.find({
                where: {
                    deletedAt: IsNull(),
                    appointment: {
                        status: In([
                            AppointmentStatusType.COMPLETED,
                            AppointmentStatusType.CANCELLED,
                            AppointmentStatusType.NO_SHOW,
                        ]),
                        updatedAt: LessThan(sixMonthsAgo),
                    },
                },
                relations: {
                    appointment: true,
                },
            });

            let archiveCount = 0;

            for (const question of oldQuestions) {
                try {
                    // Soft delete the question
                    await this.questionRepository.softDelete(question.id);

                    // Clean up Redis data
                    await this.cleanupQuestionRoom(question.id);

                    archiveCount++;

                    this.logger.debug(
                        `Archived old question: ${question.id} (appointment: ${question.appointment?.id})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error archiving question ${question.id}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Question archival completed. Archived ${archiveCount} questions`,
            );
            return archiveCount;
        } catch (error) {
            this.logger.error('Error during question archival:', error);
            throw error;
        }
    }

    /**
     * Immediately cleanup chat room when appointment is completed/cancelled
     * This should be called from appointment service when status changes
     */
    async cleanupRoomOnAppointmentStatusChange(
        appointmentId: string,
        newStatus: AppointmentStatusType,
    ): Promise<void> {
        try {
            // Only cleanup for final statuses
            const finalStatuses = [
                AppointmentStatusType.COMPLETED,
                AppointmentStatusType.CANCELLED,
                AppointmentStatusType.NO_SHOW,
            ];

            if (!finalStatuses.includes(newStatus)) {
                return;
            }

            // Find the question associated with this appointment
            const question = await this.questionRepository.findOne({
                where: { appointment: { id: appointmentId } },
                relations: {
                    appointment: true,
                },
            });

            if (!question) {
                this.logger.debug(
                    `No chat room found for appointment ${appointmentId}`,
                );
                return;
            }

            // For completed appointments, keep room for 24 hours for follow-up questions
            // For cancelled/no-show, cleanup immediately
            if (newStatus === AppointmentStatusType.COMPLETED) {
                // Set a shorter TTL for completed consultation rooms
                const oneDayInSeconds = 24 * 60 * 60;
                await this.redisClient.expire(
                    `${REDIS_KEYS.QUESTION_USERS}${question.id}`,
                    oneDayInSeconds,
                );
                await this.redisClient.expire(
                    `${REDIS_KEYS.TYPING_USERS}${question.id}`,
                    oneDayInSeconds,
                );

                this.logger.log(
                    `Set 24-hour TTL for completed consultation room: ${question.id} (appointment: ${appointmentId})`,
                );
            } else {
                // Immediate cleanup for cancelled/no-show
                await this.cleanupQuestionRoom(question.id);

                this.logger.log(
                    `Immediately cleaned up ${newStatus} consultation room: ${question.id} (appointment: ${appointmentId})`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Error cleaning up room for appointment ${appointmentId} with status ${newStatus}:`,
                error,
            );
        }
    }

    /**
     * Clean up all chat rooms older than 2 days
     * This method will clear both Redis data and optionally archive old questions
     */
    async cleanupOldChatRooms(daysOld: number = 2): Promise<{
        redisCleanupCount: number;
        archivedQuestionsCount: number;
    }> {
        try {
            this.logger.log(
                `Starting cleanup of chat rooms older than ${daysOld} days...`,
            );

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            // Find all questions older than the specified days
            const oldQuestions = await this.questionRepository.find({
                where: {
                    deletedAt: IsNull(),
                    createdAt: LessThan(cutoffDate),
                },
                relations: {
                    appointment: true,
                },
            });

            let redisCleanupCount = 0;
            let archivedQuestionsCount = 0;

            for (const question of oldQuestions) {
                try {
                    // Clean up Redis data for this question
                    await this.cleanupQuestionRoom(question.id);
                    redisCleanupCount++;

                    // Optionally archive questions that are very old (older than 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    if (question.createdAt < thirtyDaysAgo) {
                        // Soft delete the question for very old ones
                        await this.questionRepository.softDelete(question.id);
                        archivedQuestionsCount++;

                        this.logger.debug(
                            `Archived old question: ${question.id} (created: ${question.createdAt.toISOString()})`,
                        );
                    }

                    this.logger.debug(
                        `Cleaned up old chat room: ${question.id} (created: ${question.createdAt.toISOString()})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up question room ${question.id}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Old chat rooms cleanup finished. Cleaned up ${redisCleanupCount} Redis rooms, archived ${archivedQuestionsCount} questions`,
            );

            return {
                redisCleanupCount,
                archivedQuestionsCount,
            };
        } catch (error) {
            this.logger.error('Error during old chat rooms cleanup:', error);
            throw error;
        }
    }

    /**
     * Clean up chat rooms for questions without appointments older than 2 days
     * These are typically standalone questions that haven't been converted to appointments
     */
    async cleanupStandaloneQuestions(daysOld: number = 2): Promise<number> {
        try {
            this.logger.log(
                `Starting cleanup of standalone questions older than ${daysOld} days...`,
            );

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            // Find questions without appointments that are older than specified days
            const standaloneQuestions = await this.questionRepository.find({
                where: {
                    deletedAt: IsNull(),
                    createdAt: LessThan(cutoffDate),
                    appointment: IsNull(),
                },
            });

            let cleanupCount = 0;

            for (const question of standaloneQuestions) {
                try {
                    // Clean up Redis data
                    await this.cleanupQuestionRoom(question.id);

                    // Soft delete the question
                    await this.questionRepository.softDelete(question.id);

                    cleanupCount++;

                    this.logger.debug(
                        `Cleaned up standalone question: ${question.id} (created: ${question.createdAt.toISOString()})`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error cleaning up standalone question ${question.id}:`,
                        error,
                    );
                }
            }

            this.logger.log(
                `Standalone questions cleanup finished. Cleaned up ${cleanupCount} questions`,
            );
            return cleanupCount;
        } catch (error) {
            this.logger.error(
                'Error during standalone questions cleanup:',
                error,
            );
            throw error;
        }
    }
}
