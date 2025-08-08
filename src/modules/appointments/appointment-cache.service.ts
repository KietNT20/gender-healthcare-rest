import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesNameEnum } from 'src/enums';
import { In, Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/entities/user.entity';

/**
 * @class AppointmentCacheService
 * @description Cache service để giảm số lượng database queries trong appointment creation
 */
@Injectable()
export class AppointmentCacheService {
    private readonly logger = new Logger(AppointmentCacheService.name);
    private consultantCache = new Map<string, User>();
    private serviceCache = new Map<string, Service[]>();
    private cacheExpiration = 5 * 60 * 1000; // 5 minutes

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
    ) {}

    /**
     * Get consultant với cache
     */
    async getCachedConsultant(consultantId: string): Promise<User | null> {
        const cacheKey = `consultant_${consultantId}`;

        // Check cache first
        if (this.consultantCache.has(cacheKey)) {
            const cached = this.consultantCache.get(cacheKey);
            if (cached && this.isCacheValid(cached)) {
                return cached;
            }
        }

        // Query from database
        const consultant = await this.userRepository.findOne({
            where: {
                id: consultantId,
                role: {
                    name: RolesNameEnum.CONSULTANT,
                },
                isActive: true,
            },
            relations: {
                consultantProfile: true,
            },
        });

        // Cache result
        if (consultant) {
            (consultant as any)._cacheTime = Date.now();
            this.consultantCache.set(cacheKey, consultant);
        }

        return consultant;
    }

    /**
     * Get services với cache
     */
    async getCachedServices(serviceIds: string[]): Promise<Service[]> {
        const cacheKey = serviceIds.sort().join(',');

        // Check cache first
        if (this.serviceCache.has(cacheKey)) {
            const cached = this.serviceCache.get(cacheKey);
            if (cached && cached.length > 0 && this.isCacheValid(cached[0])) {
                return cached;
            }
        }

        // Query from database
        const services = await this.serviceRepository.find({
            where: {
                id: In(serviceIds),
                isActive: true,
            },
            relations: {
                category: true,
            },
        });

        // Cache result
        if (services.length > 0) {
            services.forEach((service) => {
                (service as any)._cacheTime = Date.now();
            });
            this.serviceCache.set(cacheKey, services);
        }

        return services;
    }

    /**
     * Clear cache for specific consultant
     */
    clearConsultantCache(consultantId: string): void {
        const cacheKey = `consultant_${consultantId}`;
        this.consultantCache.delete(cacheKey);
    }

    /**
     * Clear all cache
     */
    clearAllCache(): void {
        this.consultantCache.clear();
        this.serviceCache.clear();
    }

    /**
     * Check if cache is still valid
     */
    private isCacheValid(cachedItem: any): boolean {
        if (!cachedItem._cacheTime) return false;
        return Date.now() - cachedItem._cacheTime < this.cacheExpiration;
    }

    /**
     * Background cleanup of expired cache entries
     */
    cleanupExpiredCache(): void {
        // Cleanup consultant cache
        for (const [key, value] of this.consultantCache.entries()) {
            if (!this.isCacheValid(value)) {
                this.consultantCache.delete(key);
            }
        }

        // Cleanup service cache
        for (const [key, values] of this.serviceCache.entries()) {
            if (values.length === 0 || !this.isCacheValid(values[0])) {
                this.serviceCache.delete(key);
            }
        }
    }
}
