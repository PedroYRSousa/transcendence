import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import { BadRequestException, ForbiddenException, HttpException, InternalServerErrorException, Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';

import { Connection } from './websocket.connection';
import { MiddlewareGuard } from './websocket.guard';
import { ExceptionsFilter } from './websocket.filter';
import { LoggingInterceptor } from './websocket.interceptor';
import { AuthService } from 'src/controllers/auth/auth.service';
import { UsersService } from 'src/controllers/users/users.service';
import { Room } from './entities/room';
import { ChatService } from 'src/controllers/chat/chat.service';
import { ContentService } from 'src/controllers/content/content.service';
import { User } from 'src/controllers/users/entities/user.entity';
import { Chat } from 'src/controllers/chat/entities/chat.entity';
import { Player } from './entities/player';
import { GameService } from 'src/controllers/game/game.service';

export class Messages extends Connection {
	constructor(
		protected readonly logger: Logger,
		protected readonly chatService: ChatService,
		protected readonly authService: AuthService,
		protected readonly usersService: UsersService,
		protected readonly contentService: ContentService,
		protected readonly gameService: GameService,
	) {
		super('Game', authService, usersService);

		Room.init(this.gameService, this.usersService);
	}

	// Auth
	@UseInterceptors(LoggingInterceptor)
	@UseFilters(new ExceptionsFilter(`WSChat`))
	@SubscribeMessage(`auth`)
	auth(@ConnectedSocket() client: Socket) {
		this.handleConnection(client);
	}

	// Chat
	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard)
	@UseFilters(new ExceptionsFilter(`WSChat`))
	@SubscribeMessage(`WSChat:enterChat`)
	enterChat(client: Socket, data: any) {
		const { user, chat } = data as { user: User; chat: Chat };

		client.join(chat.id.toString());
		Connection.emitToRoom(this.server, chat.id.toString(), 'WSChat:memberEnterInChat', user);
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard)
	@UseFilters(new ExceptionsFilter(`WSChat`))
	@SubscribeMessage(`WSChat:leaveChat`)
	leaveChat(client: Socket, data: any) {
		const { user, chat } = data as { user: User; chat: Chat };

		client.leave(chat.id.toString());
		Connection.emitToRoom(this.server, chat.id.toString(), 'WSChat:memberLeaveInChat', user);
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard)
	@UseFilters(new ExceptionsFilter(`WSChat`))
	@SubscribeMessage(`WSChat:sendMessage`)
	async sendMessage(client: Socket, data: any) {
		const { user, chat, text } = data as { user: User; chat: Chat; text: string };

		const chatDB = await this.chatService.findOneByIdWithSecret(chat.id).toPromise();

		if (chatDB instanceof HttpException) throw chatDB;
		if (chatDB.members.filter((m) => m.id === user.id).length <= 0) throw new BadRequestException('Usuário não é membro do chat');

		if (chatDB.mutes.includes(user.id)) {
			throw new ForbiddenException('Usuario esta silenciado');
		} else {
			this.contentService.create({ author: user, chat: chatDB, text }).subscribe((content) => {
				if (content instanceof HttpException) throw content;

				delete chatDB.admins;
				delete chatDB.kicks;
				delete chatDB.password;
				delete chatDB.salt;

				content.author['connected'] = false;
				content.author['inGame'] = false;

				for (const [_, map] of Connection.authConnections) {
					if (map.user.id === content.author.id) content.author['connected'] = true;

					const rooms = [...Room.privateRooms.rooms, ...Room.publicRooms.rooms];
					for (const room of rooms)
						if (room.game.player1.playerID === map.user.id || (room.game.player2 && room.game.player2.playerID === map.user.id)) content.author['inGame'] = true;
				}

				const response = { chat: chatDB, content };

				for (const [_, conns] of Connection.authConnections) {
					if (chatDB.members.filter((m) => m.id === conns.user.id).length <= 0) continue;

					Connection.emit(conns.client, 'WSChat:newMessage', response);
				}
			});
		}
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSChat')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:createChalenge')
	async createChalenge(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const { user, chat, userTarget, alternative } = data;

		let room = Room.findRoomByUser(user);
		if (room) throw new InternalServerErrorException('Não foi possivel desafiar o usuario, você tem um jogo pendente');

		const roomTarget = Room.findRoomByUser(userTarget);
		if (roomTarget) throw new InternalServerErrorException('Não foi possivel desafiar o usuario, ele esta ocupado');

		this.createGame(client, { user, publicRoom: false, alternative });
		room = Room.findRoomByUser(user);
		if (!room) throw new InternalServerErrorException('Ops, Não foi possivel desafiar o usuario');

		this.sendMessage(client, { user, chat, text: `/game/${room.id}` })
			.then(() => {
				Connection.emit(client, 'WSChat:openGameView', {});
			})
			.catch((err) => {
				this.logger.error(err);

				throw new InternalServerErrorException('Ops, Não foi possivel desafiar o usuario');
			});

		return null;
	}

	// Game
	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:createGame')
	createGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const { user, publicRoom, alternative } = data;

		if (publicRoom) {
			if (!Room.hasWatingRoom()) Room.createRoom(client, this.server, user, alternative, publicRoom);
			else {
				const room = Room.publicRooms.rooms.find((r) => r.id === Room.publicRooms.waitingRooms[0]);
				if (!room || room.game.alternative !== alternative) {
					Room.createRoom(client, this.server, user, alternative, publicRoom);
					return;
				}

				Room.enterRoom(client, this.server, user, alternative, publicRoom);
			}
		} else {
			Room.createRoom(client, this.server, user, alternative, publicRoom);
		}
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:enterGame')
	enterGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const { user, roomID } = data;

		const room = Room.findRoom(roomID);
		if (!room) return Connection.emit(client, 'WSGame:roomNotFound', {});

		Room.enterPrivateRoom(client, this.server, user, room);
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:watchGame')
	watchGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const { user, roomID } = data;

		const room = Room.findRoom(roomID);
		if (!room) return Connection.emit(client, 'WSGame:roomNotFound', {});

		// Entra para assistir
		return Connection.emit(client, 'WSGame:roomNotFound', {});
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:watchRandomGame')
	watchRandomGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const { user } = data;

		if (Room.publicRooms.runningRooms.length <= 0) return Connection.emit(client, 'WSGame:roomNotFound', {});

		const roomID = Math.floor(Math.random() * Room.publicRooms.runningRooms.length);
		const room = Room.findRoom(Room.publicRooms.runningRooms[roomID]);
		if (!room) return Connection.emit(client, 'WSGame:roomNotFound', {});

		// Entra para assistir
		return Connection.emit(client, 'WSGame:roomNotFound', {});
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:pauseGame')
	pauseGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const room = Room.findRoomByUser(data.user);
		if (!room) return;
		if (Room.isWaitingRoom(room)) return;

		let player: Player | null = null;

		if (room.game.player1.playerID === data.user.id) player = room.game.player1;
		else if (room.game.player2.playerID === data.user.id) player = room.game.player2;
		if (!player) return;

		room.game.pauseGame(player);
	}

	@UseInterceptors(LoggingInterceptor)
	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:resumeGame')
	resumeGame(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const room = Room.findRoomByUser(data.user);
		if (!room) return;

		if (Room.isWaitingRoom(room)) {
			console.log('aqui');
			const publicRoom = Room.publicRooms.waitingRooms.includes(room.id);
			const playerNo = room.game.player1.playerID === data.user.id ? 1 : 2;

			Connection.emit(client, 'WSGame:playerNo', playerNo);
			Connection.emitToRoom(this.server, room.id, 'WSGame:displayRoomID', publicRoom ? null : room.id);
			return;
		}

		let player: Player | null = null;

		if (room.game.player1.playerID === data.user.id) player = room.game.player1;
		else if (room.game.player2.playerID === data.user.id) player = room.game.player2;
		if (!player) return;

		room.game.resumeGame(player);
	}

	@UseGuards(MiddlewareGuard) // Valida se o socket esta autenticado, deve-se estar em todos os caminhos do socket
	@UseFilters(new ExceptionsFilter('WSGame')) // Lida com as exceções, envia o erro para WSGame:error
	@SubscribeMessage('WSGame:move')
	move(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		const room = Room.findRoom(data.roomID);
		if (!room) return;

		let player: Player | null = null;

		if (room.game.player1.playerID === data.user.id) player = room.game.player1;
		else if (room.game.player2.playerID === data.user.id) player = room.game.player2;
		if (!player) return;

		player.move(room.game.frameRate, data.direction);
		room.game.updateGame();
	}
}
