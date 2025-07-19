import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PaymentValidationService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    /**
     * Validate user existence
     */
    async validateUser(userId: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId, deletedAt: IsNull(), isActive: true },
        });

        if (!user) {
            throw new UnauthorizedException(
                `User with ID '${userId}' unauthorized or does not exist.`,
            );
        }

        return user;
    }

    /**
     * Validate payment amount
     */
    validateAmount(amount: number): number {
        const finalAmount = Number(parseFloat(amount.toString()).toFixed(2));

        if (isNaN(finalAmount)) {
            throw new BadRequestException(
                'Invalid amount: Unable to parse amount as a number.',
            );
        }

        if (finalAmount < 0.01 || finalAmount > 10000000000) {
            throw new BadRequestException(
                `Invalid amount: ${finalAmount}. Amount must be between 0.01 and 10,000,000,000 VND.`,
            );
        }

        return finalAmount;
    }

    /**
     * Validate order code format
     */
    validateOrderCode(orderCode: string): number {
        const orderCodeNumber = parseInt(orderCode);

        if (isNaN(orderCodeNumber)) {
            throw new BadRequestException(
                `OrderCode không hợp lệ: ${orderCode}`,
            );
        }

        return orderCodeNumber;
    }

    /**
     * Validate invoice number exists
     */
    validateInvoiceNumber(invoiceNumber?: string): string {
        if (!invoiceNumber) {
            throw new BadRequestException(
                'Payment không có orderCode để xử lý',
            );
        }

        return invoiceNumber;
    }

    /**
     * Helper method để redirect về frontend với query params
     */
    createRedirectResponse(baseUrl: string, params: Record<string, any>) {
        const url = new URL(baseUrl);
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, String(params[key]));
            }
        });

        return {
            redirectUrl: url.toString(),
            statusCode: 302,
        };
    }

    /**
     * Validate cancellation reason
     */
    validateCancellationReason(reason?: string): string {
        return reason || 'Hủy bởi người dùng';
    }
}
