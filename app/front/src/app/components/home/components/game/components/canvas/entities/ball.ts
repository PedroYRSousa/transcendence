import { Player } from './player';

export interface I_Ball {
	readonly DEFAULT_RADIUS: number;
	readonly MAX_SPEED: number;
	readonly DEFAULT_SPEED: number;
	readonly DEFAULT_SPEED_SCALE: number;
	readonly DEFAULT_X_POSITION_SCORE: number;
	readonly DEFAULT_Y_POSITION_WALL: number;
	readonly DEFAULT_COLOR_BALL: string;

	color: string;
	x: number;
	y: number;
	dx: number;
	dy: number;
	radius: number;
	speed: number;
	alternative: boolean;
	displayW: number;
	displayH: number;
}

export class Ball implements I_Ball {
	readonly DEFAULT_RADIUS: number;
	readonly MAX_SPEED: number;
	readonly DEFAULT_SPEED: number;
	readonly DEFAULT_SPEED_SCALE: number;
	readonly DEFAULT_X_POSITION_SCORE: number;
	readonly DEFAULT_Y_POSITION_WALL: number;
	readonly DEFAULT_COLOR_BALL: string;

	color!: string;
	x!: number;
	y!: number;
	dx!: number;
	dy!: number;
	radius!: number;
	speed!: number;
	alternative!: boolean;
	displayW!: number;
	displayH!: number;

	constructor(ball: I_Ball) {
		this.DEFAULT_RADIUS = ball.DEFAULT_RADIUS;
		this.DEFAULT_SPEED = ball.DEFAULT_SPEED;
		this.DEFAULT_SPEED_SCALE = ball.DEFAULT_SPEED_SCALE;
		this.DEFAULT_X_POSITION_SCORE = ball.DEFAULT_X_POSITION_SCORE;
		this.DEFAULT_Y_POSITION_WALL = ball.DEFAULT_Y_POSITION_WALL;
		this.MAX_SPEED = ball.MAX_SPEED;
		this.DEFAULT_COLOR_BALL = ball.DEFAULT_COLOR_BALL;
		this.update(ball);
	}

	toInterface(): I_Ball {
		return { ...this };
	}

	update(ball: I_Ball) {
		this.alternative = ball.alternative;
		this.displayH = ball.displayH;
		this.displayW = ball.displayW;
		this.dx = ball.dx;
		this.dy = ball.dy;
		this.radius = ball.radius;
		this.speed = ball.speed;
		this.x = ball.x;
		this.y = ball.y;
		this.color = ball.color;
	}

	draw(context: any) {
		context.fillStyle = this.color;
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		context.fill();
	}

	checkCollision(p1: Player, p2: Player) {
		/* Colisão paredes de cima e baixo */
		if (this.y < this.DEFAULT_Y_POSITION_WALL || this.y > this.displayH - this.DEFAULT_Y_POSITION_WALL) {
			this.dy *= -1;

			if (this.y < this.DEFAULT_Y_POSITION_WALL) {
				this.y = this.DEFAULT_Y_POSITION_WALL;
			}
			if (this.y > this.displayH - this.DEFAULT_Y_POSITION_WALL) {
				this.y = this.displayH - this.DEFAULT_Y_POSITION_WALL;
			}

			return true;
		}

		/* Colisão paredes da esquerda e direita (pontos) */
		if (this.x < this.DEFAULT_X_POSITION_SCORE) {
			p2.score += 1;

			return true;
		}

		if (this.x > this.displayW - this.DEFAULT_X_POSITION_SCORE) {
			p1.score += 1;

			return true;
		}

		return false;
	}

	move(frameRate: number) {
		this.x += (this.dx * this.speed) / frameRate;
		this.y += (this.dy * this.speed) / frameRate;
	}

	updateSpeed() {
		this.speed = Math.floor(this.DEFAULT_SPEED_SCALE * this.speed);

		if (this.speed >= this.MAX_SPEED) this.speed = this.MAX_SPEED;
	}
}
