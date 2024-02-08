import { Ball } from './ball';

export class Wall {
	x: number;
	y: number;
	w: number;
	h: number;

	constructor(displayW: number, displayH: number) {
		this.w = 10;
		this.h = displayH / 2;
		this.x = displayW / 2 - this.w / 2;
		this.y = this.h - displayH / 4;
	}

	checkCollision(ball: Ball) {
		// Face lateral esquerda
		if (ball.x + ball.radius >= this.x && ball.x <= this.x) {
			if (ball.y >= this.y && ball.y <= this.y + this.h) {
				ball.dx = -1;

				return true;
			}
		}

		// Face lateral direita
		if (ball.x - ball.radius <= this.x + this.w && ball.x >= this.x + this.w) {
			if (ball.y >= this.y && ball.y <= this.y + this.h) {
				ball.dx = 1;

				return true;
			}
		}

		// Face superior
		if (ball.y + ball.radius >= this.y && ball.y <= this.y) {
			if (ball.x >= this.x && ball.x <= this.x + this.w) {
				ball.dy = -1;

				return true;
			}
		}

		// Face inferior
		if (ball.y - ball.radius <= this.y + this.h && ball.y >= this.y + this.h) {
			if (ball.x >= this.x && ball.x <= this.x + this.w) {
				ball.dy = 1;

				return true;
			}
		}

		return false;
	}
}
