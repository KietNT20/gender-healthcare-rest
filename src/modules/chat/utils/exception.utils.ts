import { WsException } from '@nestjs/websockets';
import { ERROR_MESSAGES } from '../constants/messages';

export function convertToWsException(error: any): WsException {
    if (error instanceof WsException) {
        return error;
    }

    if (error instanceof Error) {
        return new WsException(error.message);
    }

    return new WsException(ERROR_MESSAGES.INTERNAL_ERROR);
}

export function getWsErrorMessage(error: any): string {
    if (error instanceof WsException) {
        return error.getError() as string;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return ERROR_MESSAGES.INTERNAL_ERROR;
}

export function createWsErrorResponse(
    error: any,
    additionalData?: Record<string, unknown>,
): {
    status: string;
    message: string;
    timestamp: string;
    [key: string]: unknown;
} {
    const response: {
        status: string;
        message: string;
        timestamp: string;
        [key: string]: unknown;
    } = {
        status: 'error',
        message: getWsErrorMessage(error),
        timestamp: new Date().toISOString(),
    };

    if (additionalData) {
        Object.assign(response, additionalData);
    }

    return response;
}

export function createWsSuccessResponse(
    data: unknown,
    message?: string,
): {
    status: string;
    message: string;
    data: unknown;
    timestamp: string;
} {
    return {
        status: 'success',
        message: message || 'Operation completed successfully',
        data,
        timestamp: new Date().toISOString(),
    };
}
