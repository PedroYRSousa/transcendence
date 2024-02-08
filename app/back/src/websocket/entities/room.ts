import { randomUUID } from 'crypto';
import { Ball } from './ball';
import { Player } from './player';
import { Server, Socket } from 'socket.io';
import { Game } from './game';
import { OnEvent } from '@nestjs/event-emitter';
import { Connection } from 'src/websocket/websocket.connection';
import { User } from 'src/controllers/users/entities/user.entity';
import { GameService } from 'src/controllers/game/game.service';
import { GameDto } from 'src/controllers/game/dto/game.dto';
import { ScoreDto } from 'src/controllers/game/dto/score.dto';
import { UsersService } from 'src/controllers/users/users.service';
import { HttpException } from '@nestjs/common';

export interface I_Room {
	id: string;
	ttl: number;
	game: Game;
}

export interface I_ObjectRoom {
	rooms: I_Room[];
	runningRooms: string[];
	waitingRooms: string[];
}

export class Room {
	public static gameService: GameService;
	public static usersService: UsersService;

	public static readonly publicRooms: I_ObjectRoom = {
		rooms: [],
		runningRooms: [],
		waitingRooms: [],
	};
	public static readonly privateRooms: I_ObjectRoom = {
		rooms: [],
		runningRooms: [],
		waitingRooms: [],
	};

	public static init(gameService: GameService, usersService: UsersService) {
		Room.gameService = gameService;
		Room.usersService = usersService;
		setInterval(() => Room.timeoutRoom(), 100);
	}

	public static hasWatingRoom() {
		return Room.publicRooms.waitingRooms.length !== 0;
	}

	public static createRoom(socket: Socket, server: Server, user: User, alternative: boolean, publicRoom: boolean) {
		const roomID = randomUUID();
		const newGame = new Game(roomID, server, this.finalGame, alternative);

		const room: I_Room = {
			id: roomID,
			game: newGame,
			ttl: Date.now(),
		};

		if (publicRoom) Room.addRoom(room, Room.publicRooms);
		else Room.addRoom(room, Room.privateRooms);

		const linkRoom = `${process.env._ROUTE_GAME}${room.id}`;

		socket.join(room.id);
		room.game.addPlayer(socket, user);
		Connection.emit(socket, 'WSGame:playerNo', 1);
		Connection.emitToRoom(server, room.id, 'WSGame:displayRoomID', publicRoom ? null : { roomID: room.id, linkRoom });
	}

	public static enterRoom(socket: Socket, server: Server, user: User, alternative: boolean, publicRoom: boolean) {
		const roomID = Room.publicRooms.waitingRooms[0];
		const room = Room.publicRooms.rooms.find((room) => room.id === roomID);

		if (!Connection.authConnections.has(room.game.player1.socketID)) {
			Room.removeRoom(room, Room.publicRooms);
			Room.removeRoom(room, Room.privateRooms);
			this.createRoom(socket, server, user, alternative, publicRoom);
			return;
		}

		if (room.game.player1.playerID === user.id) {
			Connection.emit(socket, 'WSGame:playerNo', 1);
			Connection.emitToRoom(server, room.id, 'WSGame:displayRoomID', publicRoom ? null : room.id);
			return;
		}

		Room.setRunningRoom(roomID, Room.publicRooms);
		socket.join(roomID);
		room.game.addPlayer(socket, user);
		Connection.emit(socket, 'WSGame:playerNo', 2);
		Connection.emitToRoom(server, room.id, 'WSGame:startingGame', {});

		// Emite depois de 3s startedGame para o client. Inicia a partida no server
		setTimeout(() => room.game.startGame(), 3000);
	}

	public static enterPrivateRoom(socket: Socket, server: Server, user: User, room: I_Room) {
		if (!Connection.authConnections.has(room.game.player1.socketID)) {
			Room.removeRoom(room, Room.publicRooms);
			Room.removeRoom(room, Room.privateRooms);
			Connection.emit(socket, 'WSGame:roomNotFound', {});
			return;
		}

		if (!room.game.player2) {
			room.game.addPlayer(socket, user);
			Room.setRunningRoom(room.id, Room.privateRooms);
			socket.join(room.id);
			Connection.emit(socket, 'WSGame:playerNo', 2);
			Connection.emitToRoom(server, room.id, 'WSGame:startingGame', {});

			// Emite depois de 3s startedGame para o client. Inicia a partida no server
			setTimeout(() => room.game.startGame(), 3000);
		} else Connection.emit(socket, 'WSGame:roomFull', {});
	}

	public static findRoom(roomID: string) {
		const publicRoom = Room.publicRooms.rooms.find((room) => room.id === roomID);
		if (publicRoom) return publicRoom;

		const privateRoom = Room.privateRooms.rooms.find((room) => room.id === roomID);
		return privateRoom;
	}

	public static findRoomByUser(user: User) {
		return (
			Room.publicRooms.rooms.find((r) => r.game.player1.playerID === user.id || (r.game.player2 && r.game.player2.playerID === user.id)) ??
			Room.privateRooms.rooms.find((r) => r.game.player1.playerID === user.id || (r.game.player2 && r.game.player2.playerID === user.id))
		);
	}

	public static finalGame(roomID: string, woGame: boolean = false, cancelled: boolean = false) {
		const room = Room.findRoom(roomID);
		if (!room) return;

		room.game.timeOfGame = Date.now() - room.game.gameStart;

		const isPublicRoom = Room.isPublicRoom(room);

		Room.publicRooms.rooms = Room.publicRooms.rooms.filter((r) => r.id !== roomID);
		Room.publicRooms.runningRooms = Room.publicRooms.runningRooms.filter((id) => id !== roomID);
		Room.privateRooms.rooms = Room.privateRooms.rooms.filter((r) => r.id !== roomID);
		Room.privateRooms.runningRooms = Room.privateRooms.runningRooms.filter((id) => id !== roomID);

		Room.gameService.create(room, woGame, cancelled, isPublicRoom);
	}

	public static cancelGame(roomID: string) {
		this.finalGame(roomID, false, true);
	}

	public static isWaitingRoom(room: I_Room) {
		return Room.publicRooms.waitingRooms.includes(room.id) || Room.privateRooms.waitingRooms.includes(room.id);
	}

	public static isRunningRoom(room: I_Room) {
		return Room.publicRooms.runningRooms.includes(room.id) || Room.privateRooms.runningRooms.includes(room.id);
	}

	public static isPublicRoom(room: I_Room) {
		return Room.publicRooms.rooms.find((r) => r.id === room.id) !== undefined;
	}

	public static isPrivateRoom(room: I_Room) {
		return Room.privateRooms.rooms.find((r) => r.id === room.id) !== undefined;
	}

	private static addRoom(room: I_Room, rooms: I_ObjectRoom) {
		rooms.rooms.push(room);
		rooms.waitingRooms.push(room.id);
	}

	private static removeRoom(room: I_Room, rooms: I_ObjectRoom) {
		rooms.rooms = rooms.rooms.filter((r) => r.id !== room.id);
		rooms.runningRooms = rooms.runningRooms.filter((id) => id !== room.id);
		rooms.waitingRooms = rooms.waitingRooms.filter((r) => r !== room.id);
	}

	private static setRunningRoom(roomID: string, rooms: I_ObjectRoom) {
		rooms.waitingRooms = rooms.waitingRooms.filter((r) => r !== roomID);
		rooms.runningRooms.push(roomID);
	}

	private static timeoutRoom() {
		const rooms = [...Room.publicRooms.rooms, ...Room.privateRooms.rooms];

		for (const room of rooms) {
			let waitingRoomID = Room.publicRooms.waitingRooms.find((roomID) => room.id === roomID) ?? Room.privateRooms.waitingRooms.find((roomID) => room.id === roomID);
			if (waitingRoomID) {
				if (Date.now() - room.ttl >= 30 * 1000) {
					if (Connection.authConnections.has(room.game.player1.socketID))
						Connection.emit(Connection.authConnections.get(room.game.player1.socketID).client, 'WSGame:timeoutRoom', {});
					if (room.game.player2 && Connection.authConnections.has(room.game.player2.socketID))
						Connection.emit(Connection.authConnections.get(room.game.player2.socketID).client, 'WSGame:timeoutRoom', {});

					Room.removeRoom(room, Room.publicRooms);
					Room.removeRoom(room, Room.privateRooms);
				} else {
					if (!Connection.authConnections.has(room.game.player1.socketID)) {
						Room.removeRoom(room, Room.publicRooms);
						Room.removeRoom(room, Room.privateRooms);
					}
				}
			} else {
				if (!Connection.authConnections.has(room.game.player1.socketID) && !Connection.authConnections.has(room.game.player2.socketID)) {
					Room.cancelGame(room.id);
				}
			}
		}
	}
}
