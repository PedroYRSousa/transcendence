import { Observable } from 'rxjs';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';

import { Connection } from './websocket.connection';

@Injectable()
export class MiddlewareGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const client = context.switchToWs().getClient();

		const token = client.handshake.headers['authorization'];
		if (!token) throw new ForbiddenException('Token invalido');

		const conn = Connection.getConnection(client);
		if (!conn) throw new ForbiddenException('Usuário não autenticado');

		try {
			context.switchToWs().getData()['user'] = conn.user;
			return true;
		} catch (err) {
			console.log(err);
			return false;
		}
	}
}
