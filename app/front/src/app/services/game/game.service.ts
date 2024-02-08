import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { HttpService } from '../http/http.service';
import { TokenService } from '../token/token.service';

export interface I_Score {
	value: number;
	player: {
		id: number;
	};
}

export interface I_Game {
	id: number;
	timeOfGame: number;
	woGame: boolean;
	cancelledGame: boolean;
	matchmakingGame: boolean;
	alternativeGame: boolean;
	player1: {
		id: number;
	};
	player2: {
		id: number;
	};
	winner: {
		id: number;
	};
	scores: I_Score[];
}

@Injectable({
	providedIn: 'root',
})
export class GameService {
	constructor(private readonly tokenService: TokenService, private readonly httpService: HttpService) {}

	public list(userID: number) {
		const url = `api/users/${userID}/game`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}
}
