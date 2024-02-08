import { Ball } from './ball';

export interface I_Wall {
	x: number;
	y: number;
	w: number;
	h: number;
}

export class Wall implements I_Wall {
	x!: number;
	y!: number;
	w!: number;
	h!: number;

	constructor(wall: I_Wall) {
		this.update(wall);
	}

	toInterface(): I_Wall {
		return { ...this };
	}

	update(wall: I_Wall) {
		this.w = wall.w;
		this.h = wall.h;
		this.x = wall.x;
		this.y = wall.y;
	}

	draw(context: any) {
		context.fillStyle = 'white';
		context.fillRect(this.x, this.y, this.w, this.h);
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
