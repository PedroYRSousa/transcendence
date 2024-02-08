import { User } from 'src/controllers/users/entities/user.entity';
import { Game } from '../entities/game.entity';

export class ScoreDto {
	player: User;
	game: Game;
	value: number;

	constructor(player: User, value: number, game: Game) {
		this.player = player;
		this.value = value;
		this.game = game;
	}
}
