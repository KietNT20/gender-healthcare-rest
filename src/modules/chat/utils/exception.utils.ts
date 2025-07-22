import {
    BadRequestException,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ERROR_MESSAGES } from '../constants/chat.constants';

/**
 * Converts HTTP exceptions to WebSocket exceptions for WebSocket context
 * @param error The error to convert
 * @returns WsException with appropriate message
 */
export function convertToWsException(error: any): WsException {
    if (error instanceof UnauthorizedException) {
        return new WsException(ERROR_MESSAGES.AUTHENTICATION_REQUIRED);
    }

    if (error instanceof ForbiddenException) {
        return new WsException(ERROR_MESSAGES.ACCESS_DENIED_RESOURCE);
    }

    if (error instanceof BadRequestException) {
        return new WsException(ERROR_MESSAGES.INVALID_REQUEST);
    }

    // For other errors, use the original message or a generic one
    return new WsException(
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR,
    );
}

/**
 * Gets a user-friendly error message for WebSocket events
 * @param error The error to process
 * @returns User-friendly error message
 */
export function getWsErrorMessage(error: any): string {
    if (error instanceof UnauthorizedException) {
        return ERROR_MESSAGES.AUTHENTICATION_REQUIRED;
    }

    if (error instanceof ForbiddenException) {
        return ERROR_MESSAGES.ACCESS_DENIED_RESOURCE;
    }

    if (error instanceof BadRequestException) {
        return ERROR_MESSAGES.INVALID_REQUEST;
    }

    // For other errors, use the original message or a generic one
    return error instanceof Error
        ? error.message
        : ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Checks if an error is a known HTTP exception
 * @param error The error to check
 * @returns True if it's a known HTTP exception
 */
export function isHttpException(error: any): boolean {
    return (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
    );
}
