import { Ball, I_Ball } from './ball';
import { I_Player, Player } from './player';
import { I_Wall, Wall } from './wall';

export interface I_Game {
	ball: I_Ball;
	player1: I_Player;
	player2: I_Player;
	wall?: I_Wall;
	displayH: number;
	displayW: number;
	frameRate: number;
	winner: number;
	paused: boolean;
	roomID: string;
	alternative: boolean;
}

export class Game {
	ball: Ball;
	player1: Player;
	player2: Player;
	wall?: Wall;
	displayH: number;
	displayW: number;
	frameRate: number;
	winner: number;
	paused: boolean;
	roomID: string;
	alternative: boolean;

	constructor(game: I_Game) {
		this.ball = new Ball(game.ball);
		this.player1 = new Player(game.player1);
		this.player2 = new Player(game.player2);
		if (game.wall) this.wall = new Wall(game.wall);
		this.displayH = game.displayH;
		this.displayW = game.displayW;
		this.frameRate = game.frameRate;
		this.winner = game.winner;
		this.paused = game.paused;
		this.roomID = game.roomID;
		this.alternative = game.alternative;
	}

	toInterface(): I_Game {
		return {
			...this,
			ball: this.ball.toInterface(),
			player1: this.player1.toInterface(),
			player2: this.player2.toInterface(),
			wall: this.wall?.toInterface(),
		};
	}

	updateGame(game: I_Game) {
		this.ball.update(game.ball);
		this.player1.update(game.player1);
		this.player2.update(game.player2);

		if (this.wall && game.wall) this.wall.update(game.wall);
	}

	checkCollision() {
		const p1 = this.player1;
		const p2 = this.player2;
		const ball = this.ball;
		const wall = this.wall;

		if (ball.checkCollision(p1, p2) || p1.checkCollision(ball) || p2.checkCollision(ball) || (wall && wall.checkCollision(ball))) {
			this.ball.updateSpeed();
		}
	}
}
