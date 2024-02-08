import { Injectable } from '@angular/core';
import { CookieService as CService } from 'ngx-cookie-service';

import { I_Token } from '../token/token.service';

export interface I_TwoFactorRequest {
	hashed_id: string;
	get_two_factor: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class CookieService {
	constructor(private readonly cookieService: CService) {}

	public getToken(): I_Token | null {
		if (!this.cookieService.check('created_at')) return null;
		if (!this.cookieService.check('expires_in')) return null;
		if (!this.cookieService.check('access_token')) return null;
		if (!this.cookieService.check('secret_valid_until')) return null;
		if (!this.cookieService.check('refresh_token')) return null;
		if (!this.cookieService.check('token_type')) return null;

		const created_at = parseInt(this.cookieService.get('created_at'), 10);
		if (isNaN(created_at)) return null;
		const expires_in = parseInt(this.cookieService.get('expires_in'), 10);
		if (isNaN(expires_in)) return null;
		const secret_valid_until = parseInt(this.cookieService.get('secret_valid_until'), 10);
		if (isNaN(secret_valid_until)) return null;
		const access_token = this.cookieService.get('access_token');
		const refresh_token = this.cookieService.get('refresh_token');
		const token_type = this.cookieService.get('token_type');

		return { created_at, expires_in, access_token, secret_valid_until, refresh_token, token_type };
	}

	public clearToken() {
		this.cookieService.delete('created_at');
		this.cookieService.delete('expires_in');
		this.cookieService.delete('access_token');
		this.cookieService.delete('secret_valid_until');
		this.cookieService.delete('refresh_token');
		this.cookieService.delete('token_type');
	}

	public clearTwoFactorRequest() {
		this.cookieService.delete('hashed_id');
		this.cookieService.delete('get_two_factor');
	}

	public getTwoFactorRequest(): I_TwoFactorRequest | null {
		if (!this.cookieService.check('hashed_id')) return null;
		if (!this.cookieService.check('get_two_factor')) return null;

		const hashed_id = this.cookieService.get('hashed_id');
		const get_two_factor = Boolean(this.cookieService.get('get_two_factor'));

		return { hashed_id, get_two_factor };
	}
}
