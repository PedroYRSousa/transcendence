import { Server, Socket } from 'socket.io';
import { I_Room, Room } from './room';
import { Connection } from 'src/websocket/websocket.connection';
import { Player } from './player';
import { Ball } from './ball';
import { Wall } from './wall';
import { User } from 'src/controllers/users/entities/user.entity';

export class Game {
	private static readonly DISPLAY_W = 800;
	private static readonly DISPLAY_H = 500;
	private static readonly DISPLAY_FRAMERATE = 1000 / 60;
	public static readonly PLAYER_ONE = 1;
	public static readonly PLAYER_TWO = 2;
	private static readonly PLAYER_MAX_SCORE = 1;

	ball: Ball;
	wall?: Wall;
	player1: Player;
	player2: Player;

	gameStart: number;
	timeOfGame: number;
	timeout: any;
	winner: number;
	roomID: string;
	server: Server;
	paused: boolean;
	displayW: number;
	displayH: number;
	frameRate: number;
	alternative: boolean;

	finalGame: (woGame: boolean) => void;

	constructor(roomID: string, server: Server, finalGame: (roomID: string, woGame: boolean, cancelled: boolean) => void, alternative = false) {
		this.roomID = roomID;
		this.server = server;
		this.alternative = alternative;

		this.gameStart = Date.now();
		this.displayW = Game.DISPLAY_W;
		this.displayH = Game.DISPLAY_H;
		this.frameRate = Game.DISPLAY_FRAMERATE;
		this.timeout = null;
		this.paused = false;
		this.winner = -1;

		this.ball = new Ball(this.displayW, this.displayH, alternative);
		if (alternative) {
			this.wall = new Wall(this.displayW, this.displayH);
		}

		this.finalGame = (woGame: boolean) => finalGame(roomID, woGame, false);
	}

	public addPlayer(socket: Socket, user: User) {
		if (!this.player1) {
			this.player1 = Player.defaultPlayerOne(socket, user, this.displayH);
		} else if (!this.player2) {
			this.player2 = Player.defaultPlayerTwo(socket, user, this.displayW, this.displayH);
		}
	}

	public startGame() {
		Connection.emitToRoom(this.server, this.roomID, 'WSGame:startedGame', this.sendGameInfo());

		let interval = setInterval(() => {
			if (this.paused) return;

			const coonPlayer1 = Connection.getConnection(this.player1.socketID);
			if (!coonPlayer1) return this.pauseGame(this.player1);

			const coonPlayer2 = Connection.getConnection(this.player2.socketID);
			if (!coonPlayer2) return this.pauseGame(this.player2);

			this.ball.move(this.frameRate);

			this.checkCollision();
			if (this.checkFinalGame()) {
				clearInterval(interval);
				this.finalGame(false);
			}
		}, 1000 / 65);
	}

	public checkFinalGame() {
		if (this.player1.score === Game.PLAYER_MAX_SCORE) this.winner = Game.PLAYER_ONE;
		else if (this.player2.score === Game.PLAYER_MAX_SCORE) this.winner = Game.PLAYER_TWO;
		else {
			return false;
		}

		if (this.winner >= 0) {
			this.updateGame();

			Connection.emitToRoom(this.server, this.roomID, 'WSGame:endGame', this.sendGameInfo());
			return true;
		}
	}

	public updateGame() {
		if (this.paused) return;

		Connection.emitToRoom(this.server, this.roomID, 'WSGame:updateGame', this.sendGameInfo());
	}

	public pauseGame(player: Player) {
		this.paused = true;
		Connection.emitToRoom(this.server, this.roomID, 'WSGame:pauseGame', this.sendGameInfo());

		player.isAbsent = true;

		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(() => {
			if (!this.paused) return;

			if (this.player1.isAbsent) this.winner = Game.PLAYER_TWO;
			if (this.player2.isAbsent) this.winner = Game.PLAYER_ONE;

			this.finalGame(true);
			Connection.emitToRoom(this.server, this.roomID, 'WSGame:WOGame', this.sendGameInfo());
			if (this.timeout) clearTimeout(this.timeout);
		}, 30 * 1000);
	}

	public resumeGame(player: Player) {
		this.paused = false;
		player.isAbsent = false;

		if (this.player1.isAbsent || (this.player2 && this.player2.isAbsent)) {
			this.pauseGame(this.player1.isAbsent ? this.player1 : this.player2);
			return;
		}

		if (this.timeout) clearTimeout(this.timeout);

		Connection.emitToRoom(this.server, this.roomID, 'WSGame:resumeGame', this.sendGameInfo());
	}

	public checkCollision() {
		const p1 = this.player1;
		const p2 = this.player2;
		const ball = this.ball;
		const wall = this.wall;

		if (ball.checkCollision(p1, p2) || p1.checkCollision(ball) || p2.checkCollision(ball) || (wall && wall.checkCollision(ball))) {
			this.ball.updateSpeed();
			this.updateGame();
		}
	}

	public sendGameInfo() {
		const { ball, player1, player2, wall, displayH, displayW, frameRate, winner, paused, roomID } = this;

		return { ball, player1, player2, wall, displayH, displayW, frameRate, winner, paused, roomID };
	}
}
