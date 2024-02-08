import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GameDto } from './dto/game.dto';
import { ScoreDto } from './dto/score.dto';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { Game as WSGame } from '../../websocket/entities/game';
import { Score } from './entities/score.entity';
import { I_Room } from 'src/websocket/entities/room';
import { UsersService } from '../users/users.service';
import { catchError, from, map, of } from 'rxjs';

@Injectable()
export class GameService {
	constructor(
		@Inject('GAME_REPOSITORY') private gameDB: Repository<Game>,
		@Inject('SCORE_REPOSITORY') private scoreDB: Repository<Score>,
		private readonly usersService: UsersService,
		private readonly logger: Logger = new Logger(GameService.name),
	) {}

	create(room: I_Room, woGame: boolean, cancelledGame: boolean, matchmakingGame: boolean) {
		const { game } = room;
		const { player1, player2, winner, alternative, timeOfGame } = game;

		this.usersService.get(player1.playerID).subscribe((userPlayer1) => {
			if (userPlayer1 instanceof HttpException) throw userPlayer1;

			this.usersService.get(player2.playerID).subscribe(async (userPlayer2) => {
				if (userPlayer2 instanceof HttpException) throw userPlayer2;

				const gameWinner = winner === -1 ? null : winner === WSGame.PLAYER_ONE ? userPlayer1 : userPlayer2;
				const game = new GameDto(userPlayer1, userPlayer2, gameWinner, timeOfGame, woGame, cancelledGame, matchmakingGame, alternative);
				from(this.gameDB.save(game))
					.pipe(
						catchError((err) => {
							this.logger.error(err);
							return of(null);
						}),
						map((game) => {
							if (!game) return new BadRequestException('Não foi possível registrar o jogo');
							return game as Game;
						}),
					)
					.subscribe((game) => {
						if (game instanceof HttpException) throw game;

						const score1 = new ScoreDto(userPlayer1, player1.score, game);
						from(this.scoreDB.save(score1))
							.pipe(
								catchError((err) => {
									this.logger.error(err);
									return of(null);
								}),
								map((score) => {
									if (!score) return new BadRequestException('Não foi possível registrar o score do jogo');
									return score as Score;
								}),
							)
							.subscribe(() => {
								const score2 = new ScoreDto(userPlayer2, player2.score, game);
								from(this.scoreDB.save(score2))
									.pipe(
										catchError((err) => {
											this.logger.error(err);
											return of(null);
										}),
										map((score) => {
											if (!score) return new BadRequestException('Não foi possível registrar o score do jogo');
											return score as Score;
										}),
									)
									.subscribe(() => {
										if (!matchmakingGame || cancelledGame) return;

										const points = 1;
										const multipler = alternative ? 2 : 1;

										const scoreGeralP1 = Math.max(userPlayer1.scoreGeral + points * multipler * (winner === WSGame.PLAYER_ONE ? 1 : -1), 0);

										this.usersService.updateScoreGeral(userPlayer1, scoreGeralP1).subscribe((_userPlayer1) => {
											if (_userPlayer1 instanceof HttpException) throw _userPlayer1;
										});

										const scoreGeralP2 = Math.max(userPlayer2.scoreGeral + points * multipler * (winner === WSGame.PLAYER_TWO ? 1 : -1), 0);

										this.usersService.updateScoreGeral(userPlayer2, scoreGeralP2).subscribe((_userPlayer2) => {
											if (_userPlayer2 instanceof HttpException) throw _userPlayer2;
										});
									});
							});
					});
			});
		});
	}

	findAll() {
		return from(
			this.gameDB.find({
				relations: { player1: true, player2: true, winner: true, scores: { player: true } },
				select: { player1: { id: true }, player2: { id: true }, winner: { id: true }, scores: { value: true, player: { id: true } } },
			}),
		).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((games) => {
				if (!games) return new BadRequestException('Não foi possível listar os games');
				return games as Game[];
			}),
		);
	}

	findAllByUser(userID: number) {
		return from(
			this.gameDB.find({
				where: [{ player1: { id: userID } }, { player2: { id: userID } }],
				relations: { player1: true, player2: true, winner: true, scores: { player: true } },
				select: { player1: { id: true }, player2: { id: true }, winner: { id: true }, scores: { value: true, player: { id: true } } },
			}),
		).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((games) => {
				if (!games) return new BadRequestException('Não foi possível listar os games');
				return games as Game[];
			}),
		);
	}

	findOne(id: number) {
		return from(
			this.gameDB.findOne({
				where: { id },
				relations: { player1: true, player2: true, winner: true, scores: { player: true } },
				select: { player1: { id: true }, player2: { id: true }, winner: { id: true }, scores: { value: true, player: { id: true } } },
			}),
		).pipe(
			catchError((err) => {
				this.logger.error(err);
				return of(null);
			}),
			map((game) => {
				if (!game) return new NotFoundException('Game não encontrado');
				return game as Game;
			}),
		);
	}
}
