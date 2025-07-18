import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const errorResponse: ApiResponse = {
            success: false,
            error: exceptionResponse,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(statusCode).json(errorResponse);
    }
}
