import { User } from 'src/controllers/users/entities/user.entity';
import { ScoreDto } from './score.dto';

export class GameDto {
	player1: User;
	player2: User;
	winner: User;
	woGame: boolean;
	timeOfGame: number;
	cancelledGame: boolean;
	matchmakingGame: boolean;
	alternativeGame: boolean;

	constructor(p1: User, p2: User, winner: User | null = null, timeOfGame: number, woGame: boolean, cancelledGame: boolean, matchmakingGame: boolean, alternativeGame: boolean) {
		this.player1 = p1;
		this.player2 = p2;
		this.winner = winner;
		this.woGame = woGame;
		this.timeOfGame = timeOfGame;
		this.cancelledGame = cancelledGame;
		this.matchmakingGame = matchmakingGame;
		this.alternativeGame = alternativeGame;
	}

}
