import { ApiResponse } from '@interfaces/response.interface';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();

    const errorResponse: ApiResponse = {
      success: false,
      message: exception.message,
      error: exception.getResponse(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
