import { ApiResponse } from '@interfaces/response.interface';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    const errorResponse: ApiResponse = {
      success: false,
      message,
      error:
        process.env.NODE_ENV === 'development'
          ? exception instanceof Error
            ? exception.stack
            : exception
          : undefined,
    };

    response.status(statusCode).json(errorResponse);
  }
}
