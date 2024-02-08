import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('Websocket');

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const now = Date.now();

		return next.handle().pipe(
			tap(() => {
				const pattern = context.switchToWs().getPattern();

				this.logger.log(`${pattern} ${Date.now() - now}ms`);
			}),
		);
	}
}
