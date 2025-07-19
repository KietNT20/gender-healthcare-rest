/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    BadGatewayException,
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next
            .handle()
            .pipe(
                catchError((_err) =>
                    throwError(() => new BadGatewayException()),
                ),
            );
    }
}
