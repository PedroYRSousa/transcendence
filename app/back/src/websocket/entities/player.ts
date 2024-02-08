import { Socket } from 'socket.io';
import { Ball } from './ball';
import { User } from 'src/controllers/users/entities/user.entity';

export class Player {
	private static readonly DEFAULT_WIDTH = 10; // 10
	private static readonly DEFAULT_HEIGHT = 60; // 60
	private static readonly DEFAULT_X_POSITION = 90; // 90

	private readonly DEFAULT_WIDTH = Player.DEFAULT_WIDTH;
	private readonly DEFAULT_HEIGHT = Player.DEFAULT_HEIGHT;
	private readonly DEFAULT_SCORE = 0; // 0
	private readonly DEFAULT_SPEED = 200; // 200
	private readonly DEFAULT_X_POSITION = Player.DEFAULT_X_POSITION;

	color: string;
	x: number;
	y: number;
	w: number;
	h: number;
	score: number;
	speed: number;
	displayH: number;
	playerID: number;
	socketID: string;
	playerNo: number;
	isAbsent: boolean;

	constructor(playerID: number, socketID: string, playerNo: number, x: number, y: number, displayH: number, color: string) {
		this.playerID = playerID;
		this.socketID = socketID;
		this.playerNo = playerNo;
		this.x = x;
		this.y = y;
		this.color = color;
		this.displayH = displayH;

		this.isAbsent = false;
		this.w = this.DEFAULT_WIDTH;
		this.h = this.DEFAULT_HEIGHT;
		this.score = this.DEFAULT_SCORE;
		this.speed = this.DEFAULT_SPEED;
	}

	public checkCollision(ball: Ball) {
		if (this.x === this.DEFAULT_X_POSITION) {
			if (ball.x - ball.radius < this.x + this.w && ball.x + ball.radius > this.x && ball.y - ball.radius < this.y + this.h && ball.y + ball.radius > this.y) {
				ball.dx = 1;

				// change ball direction
				if (ball.y < this.y + 30) {
					ball.dy = Math.max(Math.min(Math.random(), 1), 0.5) * -1;
				} else if (ball.y > this.y + 30) {
					ball.dy = Math.max(Math.min(Math.random(), 1), 0.5) * 1;
				} else {
					ball.dy = 0;
				}

				ball.color = this.color;
				return true;
			}
		} else if (ball.x - ball.radius < this.x + this.w && ball.x + ball.radius > this.x && ball.y - ball.radius < this.y + this.h && ball.y + ball.radius > this.y) {
			ball.dx = -1;

			/* Muda a direção da bola */
			if (ball.y < this.y + 30) {
				ball.dy = Math.max(Math.min(Math.random(), 1), 0.5) * -1;
			} else if (ball.y > this.y + 30) {
				ball.dy = Math.max(Math.min(Math.random(), 1), 0.5) * 1;
			} else {
				ball.dy = 0;
			}

			ball.color = this.color;
			return true;
		}

		return false;
	}

	public move(frameRate: number, direction: string) {
		if (direction === 'up') {
			this.y -= this.speed / frameRate;

			if (this.y < 0) this.y = 0;
		} else if (direction === 'down') {
			this.y += this.speed / frameRate;

			if (this.y > this.displayH - this.h) this.y = this.displayH - this.h;
		}
	}

	public reset() {
		this.y = this.displayH / 2 - this.DEFAULT_HEIGHT / 2;
	}

	public static defaultPlayerOne(socket: Socket, user: User, displayH: number): Player {
		const x = Player.DEFAULT_X_POSITION;
		const y = displayH / 2 - Player.DEFAULT_HEIGHT / 2;
		const playerNo = 1;

		return new Player(user.id, socket.id, playerNo, x, y, displayH, 'blue');
	}

	public static defaultPlayerTwo(socket: Socket, user: User, displayW: number, displayH: number): Player {
		const x = displayW - Player.DEFAULT_X_POSITION - Player.DEFAULT_WIDTH;
		const y = displayH / 2 - Player.DEFAULT_HEIGHT / 2;
		const playerNo = 2;

		return new Player(user.id, socket.id, playerNo, x, y, displayH, 'red');
	}
}
