import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { ProfileStatusType, RolesNameEnum } from 'src/enums';
import { HashingProvider } from 'src/modules/auth/providers/hashing.provider';
import { Document } from 'src/modules/documents/entities/document.entity';
import { FilesService } from 'src/modules/files/files.service';
import { FileResult } from 'src/modules/files/interfaces';
import { MailService } from 'src/modules/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { Role } from 'src/modules/roles/entities/role.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { RegisterConsultantDataDto } from '../dto/register-consultant.dto';
import { ConsultantProfile } from '../entities/consultant-profile.entity';

@Injectable()
export class ConsultantRegistrationService {
    private readonly logger = new Logger(ConsultantRegistrationService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(ConsultantProfile)
        private readonly consultantProfileRepository: Repository<ConsultantProfile>,
        private readonly filesService: FilesService,
        private readonly hashingProvider: HashingProvider,
        private readonly dataSource: DataSource,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) {}

    async register(
        registerDto: RegisterConsultantDataDto,
        files: {
            cv?: Express.Multer.File[];
            certificates?: Express.Multer.File[];
        },
    ): Promise<{ message: string; userId: string; profileId: string }> {
        const {
            email,
            password,
            firstName,
            lastName,
            specialization,
            qualification,
            experience,
            bio,
        } = registerDto;

        const existingUser = await this.userRepository.findOneBy({
            email: email.toLowerCase(),
        });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const consultantRole = await this.roleRepository.findOneBy({
            name: RolesNameEnum.CONSULTANT,
        });
        if (!consultantRole) {
            throw new NotFoundException('Consultant role not found');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create User
            const hashedPassword =
                await this.hashingProvider.hashPassword(password);
            const slug = slugify(`${firstName}-${lastName}-${Date.now()}`, {
                lower: true,
                strict: true,
            });
            const user = this.userRepository.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName,
                lastName,
                role: consultantRole,
                slug,
                emailVerified: true,
            });
            const savedUser = await queryRunner.manager.save(user);

            // 2. Create Consultant Profile
            const profile = this.consultantProfileRepository.create({
                user: savedUser,
                specialization,
                qualification,
                experience,
                bio,
                profileStatus: ProfileStatusType.PENDING_APPROVAL,
                consultationFee: 0,
            });
            const savedProfile = await queryRunner.manager.save(profile);

            const documentUploadPromises: Promise<FileResult>[] = [];

            if (files.cv && files.cv[0]) {
                documentUploadPromises.push(
                    this.filesService.uploadDocument({
                        file: files.cv[0],
                        entityType: 'consultant_profile',
                        entityId: savedProfile.id,
                        description: 'Curriculum Vitae',
                        isSensitive: true,
                    }),
                );
            }

            if (files.certificates && files.certificates.length > 0) {
                for (const certFile of files.certificates) {
                    documentUploadPromises.push(
                        this.filesService.uploadDocument({
                            file: certFile,
                            entityType: 'consultant_profile',
                            entityId: savedProfile.id,
                            description: 'Certificate',
                            isSensitive: true,
                        }),
                    );
                }
            }

            const uploadedFileResults = await Promise.all(
                documentUploadPromises,
            );

            if (uploadedFileResults.length > 0) {
                const documentIds = uploadedFileResults.map(
                    (result) => result.id,
                );

                const associatedDocuments = await queryRunner.manager.find(
                    Document,
                    {
                        where: { id: In(documentIds) },
                    },
                );

                savedProfile.documents = associatedDocuments;
                await queryRunner.manager.save(savedProfile);
            }

            await queryRunner.commitTransaction();

            try {
                const consultantName = `${savedUser.firstName} ${savedUser.lastName}`;

                const adminsAndManagers = await this.userRepository.find({
                    where: {
                        role: {
                            name: In([
                                RolesNameEnum.ADMIN,
                                RolesNameEnum.MANAGER,
                            ]),
                        },
                        isActive: true,
                    },
                });

                const reviewUrl = `${process.env.FRONTEND_URL}/admin/profiles/${savedProfile.id}`;

                for (const admin of adminsAndManagers) {
                    // Gửi thông báo trong ứng dụng
                    await this.notificationsService.create({
                        userId: admin.id,
                        title: 'Hồ sơ tư vấn viên mới',
                        content: `Có hồ sơ mới từ tư vấn viên "${consultantName}" đang chờ được duyệt.`,
                        type: 'NEW_PROFILE_PENDING',
                        actionUrl: reviewUrl,
                    });

                    await this.mailService.sendNewProfilePendingReviewEmail(
                        admin.email,
                        `${admin.firstName} ${admin.lastName}`,
                        consultantName,
                        reviewUrl,
                    );
                }
                this.logger.log(
                    `Sent pending profile notification to ${adminsAndManagers.length} admins/managers.`,
                );
            } catch (notificationError) {
                this.logger.error(
                    'Failed to send notification to admins/managers',
                    notificationError.stack,
                );
            }

            return {
                message:
                    'Registration successful. Your profile is pending review.',
                userId: savedUser.id,
                profileId: savedProfile.id,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                'Consultant registration failed',
                error.stack,
                error,
            );
            throw new InternalServerErrorException(
                'Could not register consultant.',
            );
        } finally {
            await queryRunner.release();
        }
    }
}
