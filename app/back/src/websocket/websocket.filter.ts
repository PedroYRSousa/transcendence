import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class ExceptionsFilter extends BaseWsExceptionFilter {
	className: string;

	constructor(className: string) {
		super();

		this.className = className;
	}

	catch(exception: any, host: ArgumentsHost): void {
		const client = host.switchToWs().getClient();

		if (exception instanceof HttpException) client.emit(`${this.className}:error`, exception.getResponse());
		else if (exception instanceof WsException) client.emit(`${this.className}:error`, exception.getError());
		else console.error(exception);
	}
}
