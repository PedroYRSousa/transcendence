import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { I_Error } from '../../app.component';
import { HttpService } from '../http/http.service';
import { ErrorService } from '../error/error.service';
import { CookieService } from '../cookie/cookie.service';
import { environment } from '../../../environments/environment';

export interface I_Token {
	created_at: number;
	expires_in: number;
	access_token: string;
	secret_valid_until: number;
	refresh_token: string;
	token_type: string;
}

@Injectable({
	providedIn: 'root',
})
export class TokenService {
	private timeoutRefreshToken: any = null;

	constructor(private readonly cookieService: CookieService, private httpService: HttpService) {
		this.checkRefreshToken();
	}

	public checkRefreshToken() {
		const token = this.getToken();

		if (this.timeoutRefreshToken) clearTimeout(this.timeoutRefreshToken);

		if (!token) return;

		this.timeoutRefreshToken = setTimeout(() => this.refresh(), (token.expires_in - 10) * 1000);
	}

	public getToken() {
		const token = this.cookieService.getToken();

		if (!token) this.cookieService.clearToken();

		return token;
	}

	public login() {
		window.location.href = `${environment.back_url}/api/auth/login42`;
	}

	public logout() {
		const token = this.getToken();

		window.location.href = `${environment.back_url}/api/auth/logout?refresh_token=${token?.refresh_token}`;
	}

	public getTokenString() {
		const token = this.getToken();

		if (!token) return '';

		return `${token.token_type} ${token.access_token}`;
	}

	public refresh() {
		const url = '/api/auth/refresh';

		const token = this.getToken();
		const tokenString = this.getTokenString();
		const headers = new HttpHeaders({ authorization: tokenString });

		if (!token) return;

		this.httpService.post(url, headers, { refresh_token: token.refresh_token }).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				const { message, error } = data as I_Error;

				const displayMessage = message ? message : error;

				alert(displayMessage);
				this.logout();
				return;
			}

			this.checkRefreshToken();
		});
	}
}
