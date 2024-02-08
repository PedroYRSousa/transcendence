import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

import { I_User } from '../user/user.service';
import { I_Error } from '../../app.component';
import { HttpService } from '../http/http.service';
import { TokenService } from '../token/token.service';

export interface I_Content {
	id?: number;
	text: string;
	author?: I_User;
}

export interface I_Chat {
	id: number;
	name: string;
	public: boolean;
	protected: boolean;
	owner: number;
	members?: I_User[];
	contents?: I_Content[];
	admins: number[];
	mutes: number[];
	kicks: number[];
	isDM: boolean;
	createTimeStamp?: Date;
	updateTimeStamp?: Date;
}

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	constructor(private readonly tokenService: TokenService, private readonly httpService: HttpService) {}

	public list() {
		const url = `/api/chat`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}

	public get(id: number) {
		const url = `/api/chat/${id}`;

		return this.httpService.get(url);
	}

	public listMyChats(id: number) {
		const url = `/api/users/${id}/chat`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}

	public listMyNotChats(id: number) {
		const url = `/api/users/${id}/chat/not`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}

	public create(name: string, isPublic: boolean, isProtect: boolean, password: string | null) {
		const url = `/api/chat`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, public: isPublic, protected: isProtect, password };

		return this.httpService.post(url, headers, body);
	}

	public findDM(user: I_User) {
		const url = `/api/action/chat/dm/${user.id}`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });

		return this.httpService.get(url, headers);
	}

	public createDM(user: I_User) {
		const url = `/api/chat/dm`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { user };

		return this.httpService.post(url, headers, body);
	}

	public update(id: number, name: string, isPublic: boolean, isProtect: boolean, password: string | null) {
		const url = `/api/chat/${id}`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, public: isPublic, protected: isProtect, password };

		return this.httpService.patch(url, headers, body);
	}

	public enter(name: string, password: string) {
		const url = `/api/action/chat/enter`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, password };

		return this.httpService.post(url, headers, body);
	}

	public exit(id: number) {
		const url = `/api/action/chat/exit`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { id };

		return this.httpService.post(url, headers, body);
	}

	public addAdmin(name: string, user: I_User) {
		const url = `/api/action/chat/addAdmin`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public removeAdmin(name: string, user: I_User) {
		const url = `/api/action/chat/removeAdmin`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public removeMember(name: string, user: I_User) {
		const url = `/api/action/chat/removeMember`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public kick(name: string, user: I_User) {
		const url = `/api/action/chat/kick`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public unKick(name: string, user: I_User) {
		const url = `/api/action/chat/unKick`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public mute(name: string, user: I_User) {
		const url = `/api/action/chat/mute`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}

	public unMute(name: string, user: I_User) {
		const url = `/api/action/chat/unMute`;

		const token = this.tokenService.getTokenString();
		const headers = new HttpHeaders({ authorization: token });
		const body = { name, user };

		return this.httpService.post(url, headers, body);
	}
}
