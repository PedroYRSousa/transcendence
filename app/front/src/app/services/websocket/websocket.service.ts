import { Injectable } from '@angular/core';

import { TokenService } from '../token/token.service';
import { ErrorService } from '../error/error.service';
import { Socket, io } from 'socket.io-client';
import { WSChat } from './chat';
import { WSGame } from './game';
import { HttpService } from '../http/http.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
	providedIn: 'root',
})
export class WebsocketService {
	static socket: Socket | null = null;
	static isAuth: boolean = false;
	static chat: WSChat | null = null;
	static game: WSGame | null = null;

	emitChat = (label: string, data: object, callback?: (data: any) => void) =>
		WebsocketService.socket?.emit(`WSChat:${label}`, data, (data: any) => (callback ? callback(data) : ''));
	emitGame = (label: string, data: object, callback?: (data: any) => void) =>
		WebsocketService.socket?.emit(`WSGame:${label}`, data, (data: any) => (callback ? callback(data) : ''));

	constructor(private readonly tokenService: TokenService, private readonly errorService: ErrorService, private readonly httpService: HttpService) {
		if (!WebsocketService.socket) this.connect();
	}

	private connect() {
		const token = this.tokenService.getToken();
		if (!token) this.tokenService.logout();

		WebsocketService.socket = io({
			extraHeaders: {
				Authorization: `${token!.token_type} ${token!.access_token}`,
			},
		});

		WebsocketService.socket.on('connect', () => this.auth());
		WebsocketService.socket.on('disconnect', () => this.errorService.handleErrorLogout({ error: 'Outra conexão foi estabelecida' }));

		WebsocketService.chat = new WSChat(this.errorService);
		this.addClassListen(WebsocketService.socket, WSChat, WebsocketService.chat, 'WSChat');
		WebsocketService.game = new WSGame(this.errorService);
		this.addClassListen(WebsocketService.socket, WSGame, WebsocketService.game, 'WSGame');

		WebsocketService.socket.on('init', () => {
			WebsocketService.isAuth = true;
		});
	}

	auth() {
		if (WebsocketService.isAuth) return;
		if (!WebsocketService.socket) return;

		const url = `/api/auth`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { socketID: WebsocketService.socket.id };

		setTimeout(() => {
			if (!WebsocketService.isAuth) this.auth();
		}, 2000);

		return this.httpService.post(url, headers, body).subscribe();
	}

	addClassListen(io: any, classToListen: any, instance: any, prefix: string) {
		const propertiesAndMethods = Object.getOwnPropertyNames(classToListen.prototype);

		propertiesAndMethods.forEach((data) => {
			if (!(instance as any)[data]) return;

			const label = `${prefix}:${data}`;

			console.log('label: ', label);
			if (typeof (instance as any)[data] === 'function') io.on(label, (input: any) => (instance as any)[data](input));
		});
	}
}
