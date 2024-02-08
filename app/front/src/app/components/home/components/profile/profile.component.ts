import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { RoutesService } from '../../../../services/routes/routes.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { GameService, I_Game } from '../../../../services/game/game.service';

@Component({
	selector: 'app-profile',
	standalone: true,
	imports: [MatSnackBarModule, MatProgressSpinnerModule],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss',
})
export class ProfileComponent {
	public user: I_User | null = null;
	public users: I_User[] | null = null;
	public games: I_Game[] | null = null;

	constructor(
		private readonly route: ActivatedRoute,
		private readonly userService: UserService,
		private readonly gameService: GameService,
		private readonly errorService: ErrorService,
		private readonly routesService: RoutesService,
	) {
		this.route.params.subscribe((params) => {
			const { id } = params;

			if (!id) return;

			this.userService.list().subscribe((data) => {
				if (HttpService.checkIsError(data)) {
					this.errorService.handleErrorSnackBar(data as I_Error);
					this.routesService.toHome();
					return;
				}

				this.users = data as I_User[];
				const user = this.users.find((u) => u.id == id)!;

				this.gameService.list(user.id).subscribe((games) => {
					if (HttpService.checkIsError(games)) {
						this.errorService.handleErrorSnackBar(games as I_Error);
						this.routesService.toHome();
						return;
					}

					this.games = games as I_Game[];
					this.user = user;
				});
			});
		});
	}

	getClassName(user: I_User) {
		let className = '';

		if (user.ranking === 1) return className + ' gold';
		if (user.ranking === 2) return className + ' silver';
		if (user.ranking === 3) return className + ' bronze';
		return className;
	}

	getNameOfPlayerForHistory(game: I_Game) {
		const player1 = this.users!.find((u) => u.id === game.player1.id)?.displayName ?? '--Deletado--';
		const player2 = this.users!.find((u) => u.id === game.player2.id)?.displayName ?? '--Deletado--';

		const scorePlayer1 = game.scores.find((s) => s.player.id === game.player1.id)?.value ?? 0;
		const scorePlayer2 = game.scores.find((s) => s.player.id === game.player2.id)?.value ?? 0;

		return `${player1} ${scorePlayer1} VS ${scorePlayer2} ${player2}`;
	}

	getClassNameHistory(game: I_Game) {
		let className = '';

		if (game.winner === null) return className + ' canceled';
		else if (game.winner.id === this.user!.id) return className + ' winner';
		else return className + ' lost';
	}

	getPlayGames(user: I_User) {
		return this.games?.length ?? 0;
	}

	getWinnerGames(user: I_User) {
		const winnerGames = this.games?.filter((g) => g.winner?.id === user.id) ?? [];

		return winnerGames.length;
	}

	getLostGames(user: I_User) {
		const lostGames = this.games?.filter((g) => g.winner?.id !== user.id) ?? [];

		return lostGames.length;
	}

	getAbandonGames(user: I_User) {
		const abandonGames = this.games?.filter((g) => g.cancelledGame) ?? [];

		return abandonGames.length;
	}

	getWOGames(user: I_User) {
		const WOGames = this.games?.filter((g) => g.woGame) ?? [];

		return WOGames.length;
	}
}
