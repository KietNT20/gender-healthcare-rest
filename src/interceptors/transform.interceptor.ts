import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { ApiResponse } from 'src/interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const customMessage =
      this.reflector.get(ResponseMessage, context.getHandler()) ||
      this.reflector.get(ResponseMessage, context.getClass());

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: customMessage,
        data,
      })),
    );
  }
}
