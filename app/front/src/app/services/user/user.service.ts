import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { TokenService } from '../token/token.service';
import { HttpService } from '../http/http.service';

export interface I_User {
	id: number;
	email: string;
	image: string | null;
	displayName: string;
	createTimeStamp: Date;
	updateTimeStamp: Date;
	twoFactor: boolean;

	blocks: I_User[];
	friends: I_User[];
	_friends: I_User[];
	connected?: boolean;
	inGame?: boolean;
	scoreGeral: number;
	ranking: number;
}

@Injectable({
	providedIn: 'root',
})
export class UserService {
	public static iam: I_User | null = null;

	constructor(private readonly tokenService: TokenService, private readonly httpService: HttpService) {}

	public get(userId: number) {
		const url = `/api/users/${userId}`;

		return this.httpService.get(url);
	}

	public my() {
		const url = '/api/auth/my';

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}

	public list() {
		const url = '/api/users';

		return this.httpService.get(url);
	}

	public update(body: FormData) {
		const url = `/api/users`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.patch(url, headers, body);
	}

	public generateTwoFactor() {
		const url = `/api/auth/generateTwoFactor`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers);
	}

	public activeTwoFactor(twoFactorCode: number) {
		const url = `/api/auth/activeTwoFactor`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers, { twoFactorCode });
	}

	public validTwoFactor(twoFactorCode: number, hashed_id: string) {
		const url = `/api/auth/validTwoFactor`;

		return this.httpService.post(url, new HttpHeaders(), { twoFactorCode, hashed_id });
	}

	public deactivateTwoFactor(twoFactorCode: number) {
		const url = `/api/auth/deactivateTwoFactor`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers, { twoFactorCode });
	}

	public removeFriend(user: I_User) {
		const url = `/api/users/${user.id}/removeFriend`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers);
	}

	public addFriend(user: I_User) {
		const url = `/api/users/${user.id}/addFriend`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers);
	}

	public unBlock(user: I_User) {
		const url = `/api/users/${user.id}/unBlock`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers);
	}

	public block(user: I_User) {
		const url = `/api/users/${user.id}/block`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.post(url, headers);
	}

	public getInvites(user: I_User) {
		const url = `/api/users/${user.id}/invites`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}
}
