import { RouterModule } from '@angular/router';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { ChatService } from '../../../../services/chat/chat.service';
import { EventsService } from '../../../../services/events/events.service';
import { RoutesService } from '../../../../services/routes/routes.service';
import { WebsocketService } from '../../../../services/websocket/websocket.service';

@Component({
	selector: 'app-resume-profile',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatMenuModule, MatButtonModule, MatIconModule, RouterModule, MatBadgeModule, MatSnackBarModule],
	templateUrl: './resume-profile.component.html',
	styleUrl: './resume-profile.component.scss',
})
export class ResumeProfileComponent {
	@Input({ required: true }) public user!: I_User;
	@Input({ required: false }) public iAm: I_User | null = null;
	@Input({ required: false }) public isMy: boolean = false;
	@Input({ required: false }) public inChat: boolean = false;
	@Input({ required: false }) public onlyImage: boolean = false;
	@Input({ required: false }) public showBackgroud: boolean = false;

	@Output() public removeFriendCallback = new EventEmitter<I_User>();

	constructor(
		private readonly userService: UserService,
		private readonly errorService: ErrorService,
		private readonly chatService: ChatService,
		private readonly routesService: RoutesService,
		private readonly wsService: WebsocketService,
	) {}

	getStatus() {
		if (!this.user.connected) return 'offline';
		else if (this.isBlocked()) return 'blocked';
		else if (this.isFriend()) return 'friend';
		else if (this.inGame()) return 'busy';
		else return 'online';
	}

	inGame() {
		return this.user.inGame;
	}

	isBlocked() {
		if (!this.iAm) return false;

		return this.iAm.blocks.filter((block) => block.id === this.user.id).length > 0;
	}

	isFriend() {
		if (!this.iAm) return false;

		return this.iAm.friends.filter((block) => block.id === this.user.id).length > 0 || this.iAm._friends.filter((block) => block.id === this.user.id).length > 0;
	}

	addFriend() {
		if (!this.iAm) return;

		this.userService.addFriend(this.user).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.iAm!.friends.push(this.user);
		});
	}

	removeFriend() {
		if (!this.iAm) return;

		this.userService.removeFriend(this.user).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.iAm!.friends = this.iAm!.friends.filter((f) => f.id !== this.user.id);
			this.removeFriendCallback.emit(this.user);
		});
	}

	removeAddFriend() {
		if (this.isFriend()) this.removeFriend();
		else this.addFriend();
	}

	block() {
		if (!this.iAm) return;

		this.userService.block(this.user).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.iAm!.blocks.push(this.user);
			this.iAm!.friends = this.iAm!.friends.filter((f) => f.id !== this.user.id);
			this.removeFriendCallback.emit(this.user);
		});
	}

	unBlock() {
		if (!this.iAm) return;

		this.userService.unBlock(this.user).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogoutOrSnackBar(data as I_Error);
				return;
			}

			this.iAm!.blocks = this.iAm!.blocks.filter((f) => f.id !== this.user.id);
		});
	}

	blockUnblock() {
		if (this.isBlocked()) this.unBlock();
		else this.block();
	}

	sendMessage() {
		this.chatService.createDM(this.user).subscribe((err) => {
			if (!err || (err as I_Error).statusCode === 409) {
				this.chatService.findDM(this.user).subscribe((chat) => {
					if ((chat as I_Error).message) return this.errorService.handleErrorSnackBar(chat as I_Error);

					this.routesService.toChat();

					setTimeout(() => {
						EventsService.eventOpenDM.detail.chat = chat;
						dispatchEvent(EventsService.eventOpenDM);
					}, 500);
				});
			} else return this.errorService.handleErrorSnackBar(err as I_Error);
		});
	}

	chalenge(alternative: boolean) {
		this.chatService.createDM(this.user).subscribe((err) => {
			if (!err || (err as I_Error).statusCode === 409) {
				this.chatService.findDM(this.user).subscribe((chat) => {
					if ((chat as I_Error).message) return this.errorService.handleErrorSnackBar(chat as I_Error);

					this.wsService.emitGame('createChalenge', { chat, userTarget: this.user, alternative }, (data: any) => {
						console.log(data);
						if (!data) this.routesService.toGame();
					});
				});
			} else return this.errorService.handleErrorSnackBar(err as I_Error);
		});
	}
}
