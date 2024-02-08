import { Socket } from 'socket.io';
import { Ball } from './ball';

export interface I_Player {
	readonly DEFAULT_WIDTH: number;
	readonly DEFAULT_HEIGHT: number;
	readonly DEFAULT_SCORE: number;
	readonly DEFAULT_SPEED: number;
	readonly DEFAULT_X_POSITION: number;

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
}

export class Player {
	readonly DEFAULT_WIDTH: number;
	readonly DEFAULT_HEIGHT: number;
	readonly DEFAULT_SCORE: number;
	readonly DEFAULT_SPEED: number;
	readonly DEFAULT_X_POSITION: number;

	color!: string;
	x!: number;
	y!: number;
	w!: number;
	h!: number;
	score!: number;
	speed!: number;
	displayH!: number;
	playerID!: number;
	socketID!: string;
	playerNo!: number;
	isAbsent!: boolean;

	constructor(player: I_Player) {
		this.DEFAULT_HEIGHT = player.DEFAULT_HEIGHT;
		this.DEFAULT_SCORE = player.DEFAULT_SCORE;
		this.DEFAULT_SPEED = player.DEFAULT_SPEED;
		this.DEFAULT_WIDTH = player.DEFAULT_WIDTH;
		this.DEFAULT_X_POSITION = player.DEFAULT_X_POSITION;
		this.update(player);
	}

	public update(player: I_Player) {
		this.displayH = player.displayH;
		this.h = player.h;
		this.isAbsent = player.isAbsent;
		this.playerID = player.playerID;
		this.playerNo = player.playerNo;
		this.score = player.score;
		this.playerNo = player.playerNo;
		this.speed = player.speed;
		this.socketID = player.socketID;
		this.w = player.w;
		this.x = player.x;
		this.y = player.y;
		this.color = player.color;
	}

	toInterface(): I_Player {
		return { ...this };
	}

	draw(context: any) {
		context.fillStyle = this.color;
		context.fillRect(this.x, this.y, this.w, this.h);

		/* Desenha o score */
		context.font = '20px Arial';
		context.fillText(this.score, this.x < 400 ? 370 - (this.score.toString().length - 1) * 12 : 420, 30);
		context.fillRect(this.x < 400 ? 790 : 0, 0, 10, 500);
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
}
