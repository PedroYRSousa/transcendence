import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	private logger = new Logger('HTTP');

	use(request: Request, response: Response, next: NextFunction): void {
		const { ip, method } = request;
		const userAgent = request.get('user-agent') || '';

		request.on('resume', () => {
			const url = request.url;
			const contentLength = request.get('content-length');

			const message = `${ip} | Request: ${method} ${url} ${contentLength ?? 0} | ${userAgent}`;

			this.logger.debug(message);
		});

		response.on('close', () => {
			const url = request.url;
			const { statusCode } = response;
			const contentLength = response.get('content-length');

			const message = `${ip} | Response: ${method} ${url} ${statusCode} ${contentLength ?? 0} | ${userAgent}`;

			if (statusCode < 400) this.logger.log(message);
			else this.logger.error(message);
		});

		next();
	}
}
