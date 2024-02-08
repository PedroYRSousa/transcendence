import { ForbiddenException, HttpException, Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/controllers/auth/auth.service';

import { User } from 'src/controllers/users/entities/user.entity';
import { UsersService } from 'src/controllers/users/users.service';
import { Room } from './entities/room';
import { Player } from './entities/player';

interface I_Connection {
	client: Socket;
	ttl: number;
}

interface I_AuthConnection {
	client: Socket;
	user: User;
}

interface I_TimeoutConnection {
	client: Socket;
	user: User;
	ttl: number;
}

export class Connection {
	@WebSocketServer()
	protected server: Server;

	private static readonly logger = new Logger('Websocket');
	public static connections: Map<string, I_Connection> = new Map();
	public static authConnections: Map<string, I_AuthConnection> = new Map();
	public static timeoutConnections: Map<string, I_TimeoutConnection> = new Map();

	public static emit(client: Socket, label: string, data: any) {
		client.emit(label, data);

		Connection.logger.log(`Send: ${label} ${client.id}`);
	}

	public static emitToRoom(client: Server, room: string, label: string, data: any) {
		client.to(room).emit(label, data);

		Connection.logger.log(`Send: ${label} -${room}-`);
	}

	public static getConnection(client: Socket | string) {
		if (!Connection.isAuth(client)) return null;

		if (typeof client === 'string') return Connection.authConnections.get(client);
		else return Connection.authConnections.get(client.id);
	}

	public static getConnectionByUser(user: User) {
		for (const [socketID, conn] of Connection.authConnections) {
			if (conn.user.id === user.id) return conn;
		}

		return null;
	}

	public static getTimeoutConnection(userID: string) {
		const key = Array.from(Connection.timeoutConnections.keys()).find((k) => k.includes(userID));
		if (!key) return null;

		return Connection.timeoutConnections.get(key);
	}

	protected static removeConnection(userID: string) {
		const conn = Connection.getTimeoutConnection(userID);
		if (!conn) return;

		Connection.logger.log(`Disconnect by Timeout: ${conn.client.id}`);

		conn.client.disconnect();
		Connection.timeoutConnections.delete(userID);
	}

	public static addConnection(client: Socket, user: User) {
		if (Connection.connections.has(client.id)) Connection.connections.delete(client.id);

		const connTimeout = Connection.getTimeoutConnection(user.id.toString());
		if (connTimeout) {
			Connection.logger.log(`Reconnecting: ${connTimeout.client.id} -> ${client.id}`);

			const room = Room.findRoomByUser(user);
			if (room && Room.isRunningRoom(room)) {
				client.join(room.id);
				let player: Player | null = null;

				if (room.game.player1.playerID === user.id) player = room.game.player1;
				else if (room.game.player2.playerID === user.id) player = room.game.player2;

				if (player) {
					console.log('resume');

					player.socketID = client.id;

					setTimeout(() => room.game.resumeGame(player), 500);
				}
			}

			connTimeout.client.disconnect();
			Connection.timeoutConnections.delete(user.id.toString());
		}

		const connAuth = Connection.getConnectionByUser(user);
		if (connAuth) {
			Connection.logger.log(`Redirect: ${connAuth.client.id} -> ${client.id}`);

			const room = Room.findRoomByUser(user);
			if (room && Room.isRunningRoom(room)) {
				client.join(room.id);
				let player: Player | null = null;

				if (room.game.player1.playerID === user.id) player = room.game.player1;
				else if (room.game.player2.playerID === user.id) player = room.game.player2;

				if (player) {
					player.socketID = client.id;

					setTimeout(() => room.game.resumeGame(player), 500);
				}
			}

			connAuth.client.disconnect();
			Connection.authConnections.delete(connAuth.client.id);
		} else Connection.logger.log(`Connection: ${client.id}`);

		Connection.authConnections.set(client.id, { client, user });
		Connection.emit(client, 'init', {});
	}

	protected static isAuth(client: Socket | string) {
		if (typeof client === 'string') return Connection.authConnections.has(client);
		else return Connection.authConnections.has(client.id);
	}

	protected className: string;

	constructor(
		className: string,
		protected readonly authService: AuthService,
		protected readonly usersService: UsersService,
	) {
		this.className = className;

		setInterval(() => this.handleTimeout(), 1000);
	}

	public handleConnection(client: Socket) {
		Connection.connections.set(client.id, { client, ttl: Date.now() });
	}

	public handleDisconnect(client: Socket) {
		Connection.logger.log(`Disconnect: ${client.id}`);

		const conn = Connection.getConnection(client);
		if (!conn) return;

		Connection.timeoutConnections.set(`${conn.user.id}-${conn.client.id}`, { ...conn, ttl: Date.now() });
		Connection.authConnections.delete(client.id);
	}

	public handleTimeout() {
		for (const [userID, conn] of Connection.timeoutConnections) {
			if (Date.now() - conn.ttl < 30 * 1000) continue;

			Connection.removeConnection(userID);
		}

		for (const [socketID, conn] of Connection.connections) {
			if (Date.now() - conn.ttl < 60 * 1000) continue;

			Connection.connections.get(socketID).client.disconnect();
			Connection.connections.delete(socketID);
		}
	}
}
