import { AxiosError, AxiosResponse, isAxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

export interface I_DataToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	created_at: number;
	secret_valid_until: number;
}

export interface T_DataImageUser42 {
	link: string | null;
	versions: {
		large: string | null;
		medium: string | null;
		small: string | null;
		micro: string | null;
	};
}
export interface T_DataUser42 {
	id: number;
	email: string;
	login: string;
	first_name: string;
	last_name: string;
	displayname: string;
	image: T_DataImageUser42;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly httpService: HttpService,
		private readonly logger: Logger = new Logger(AuthService.name),
	) {}

	digestCode(code: string) {
		const grant_type = 'authorization_code';
		const client_id = process.env._42_CLIENT;
		const client_secret = process.env._42_SECRET;
		const redirect_uri = process.env._42_REDIRECT_URI;
		const url = `${process.env._42_PATH}/oauth/token`;

		const body = { grant_type, client_id, client_secret, code, redirect_uri };

		return this.httpService.post(url, body).pipe(
			catchError((err) => {
				if (isAxiosError(err)) {
					const { response } = err;
					const { status, data } = response;

					if (data.error_description && !data.message) data['message'] = data.error_description;

					return of(new HttpException(data, status));
				} else {
					return of(new InternalServerErrorException('Erro na api da 42, por favor tente novamente mais tarde'));
				}
			}),
			map((response) => {
				if (response instanceof HttpException) return response;
				else return response.data as I_DataToken;
			}),
			tap((response) => {
				if (response instanceof HttpException) this.logger.error(response);
			}),
		);
	}

	getUserInfoIn42(token: string) {
		const url = `${process.env._42_PATH}/v2/me`;

		const headers = { Authorization: token };

		return this.httpService.get(url, { headers }).pipe(
			catchError((err) => {
				if (isAxiosError(err)) {
					const { response } = err;
					const { status, data } = response;

					if (data.error_description && !data.message) data['message'] = data.error_description;

					return of(new HttpException(data, status));
				} else {
					return of(new InternalServerErrorException('Erro na api da 42, por favor tente novamente mais tarde'));
				}
			}),
			map((response) => {
				if (response instanceof HttpException) return response;
				else return response.data as T_DataUser42;
			}),
			tap((response) => {
				if (response instanceof HttpException) this.logger.error(response);
			}),
		);
	}

	refresh(refresh_token: string): Observable<I_DataToken | HttpException> {
		const grant_type = 'refresh_token';
		const client_id = process.env._42_CLIENT;
		const client_secret = process.env._42_SECRET;
		const redirect_uri = process.env._42_REDIRECT_URI;
		const url = `${process.env._42_PATH}/oauth/token`;

		const body = { grant_type, client_id, client_secret, refresh_token, redirect_uri };

		return this.httpService.post(url, body).pipe(
			catchError((err) => {
				if (isAxiosError(err)) {
					const { response } = err;
					const { status, data } = response;

					if (data.error_description && !data.message) data['message'] = data.error_description;

					return of(new HttpException(data, status));
				} else {
					return of(new InternalServerErrorException('Erro na api da 42, por favor tente novamente mais tarde'));
				}
			}),
			map((response) => {
				if (response instanceof HttpException) return response;
				else return response.data as I_DataToken;
			}),
			tap((response) => {
				if (response instanceof HttpException) this.logger.error(response);
			}),
		);
	}
}
