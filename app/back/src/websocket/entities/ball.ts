import { Player } from './player';

export class Ball {
	private readonly DEFAULT_RADIUS = 10; // 10
	private readonly MAX_SPEED = 100; // 160
	private readonly DEFAULT_SPEED = 100; // 20
	private readonly DEFAULT_SPEED_SCALE = 1.1; // 1.1
	private readonly DEFAULT_X_POSITION_SCORE = 10; // 10
	private readonly DEFAULT_Y_POSITION_WALL = 11; // 11
	private readonly DEFAULT_COLOR_BALL = 'white';

	color: string;
	x: number;
	y: number;
	dx: number;
	dy: number;
	radius = this.DEFAULT_RADIUS;
	speed = this.DEFAULT_SPEED;
	alternative: boolean;
	displayW: number;
	displayH: number;

	public constructor(displayW: number, displayH: number, alternative = false) {
		this.alternative = alternative;
		this.displayW = displayW;
		this.displayH = displayH;
		this.reset();
	}

	public checkCollision(p1: Player, p2: Player) {
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
			this.reset();
			p1.reset();
			p2.reset();

			return true;
		}

		if (this.x > this.displayW - this.DEFAULT_X_POSITION_SCORE) {
			p1.score += 1;
			this.reset();
			p1.reset();
			p2.reset();

			return true;
		}

		return false;
	}

	public reset() {
		if (!this.alternative) {
			this.x = this.displayW / 2;
		} else {
			if (Math.random() < 0.5) this.x = this.displayW / 4;
			else this.x = this.displayW / 2 + this.displayW / 4;
		}

		this.y = this.displayH / 2;
		this.dx = Math.random() < 0.5 ? 1 : -1;
		this.dy = 0;
		this.color = this.DEFAULT_COLOR_BALL;
		this.radius = this.DEFAULT_RADIUS;
		this.speed = this.DEFAULT_SPEED;
	}

	public move(frameRate: number) {
		this.x += (this.dx * this.speed) / frameRate;
		this.y += (this.dy * this.speed) / frameRate;
	}

	public updateSpeed() {
		this.speed = Math.floor(this.DEFAULT_SPEED_SCALE * this.speed);

		if (this.speed >= this.MAX_SPEED) this.speed = this.MAX_SPEED;
	}
}
