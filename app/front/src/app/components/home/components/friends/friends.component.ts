import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component';
import { DialogInviteComponent } from './components/dialog-invite/dialog-invite.component';
import { I_Chat, I_Content } from '../../../../services/chat/chat.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import { WebsocketService } from '../../../../services/websocket/websocket.service';
import { WSChat } from '../../../../services/websocket/chat';

@Component({
	selector: 'app-friends',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatDialogModule, MatListModule, ResumeProfileComponent, MatSnackBarModule],
	templateUrl: './friends.component.html',
	styleUrl: './friends.component.scss',
})
export class FriendsComponent implements AfterViewInit {
	public pending: I_User[] = [];
	public iam: I_User | null = null;
	public users: I_User[] | null = null;

	public get Iam() {
		return UserService.iam;
	}

	constructor(
		private readonly dialog: MatDialog,
		private readonly userService: UserService,
		private readonly errorService: ErrorService,
		private readonly notificationService: NotificationService,
	) {}

	ngAfterViewInit(): void {
		addEventListener(WSChat.eventNewMessage.type, (ev) => this.handleNewMessage(ev as CustomEvent));
		this.getMy();
	}

	handleNewMessage(ev: CustomEvent) {
		if (!window.location.href.includes('/friends')) return;

		const { chat, content } = ev.detail as { chat: I_Chat; content: I_Content };

		if (content.author && this.Iam && this.Iam.blocks.find((b) => b.id === content.author?.id)) {
			return;
		}

		if (content.author) {
			const notification = `[${chat.name}] ${content.author.displayName}: ${content.text}`;

			this.notificationService.show(chat, notification);
		}
	}

	getMy() {
		this.userService.my().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogout(data as I_Error);
				return;
			}

			this.iam = data as I_User;
			this.users = this.iam.friends.filter((f1) => this.iam!._friends.some((f2) => f2.id === f1.id));
			this.getInvites(this.iam);
		});
	}

	getInvites(iam: I_User) {
		this.userService.getInvites(iam).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorSnackBar(data as I_Error);
				return;
			}

			this.showInvites(data as Array<I_User>);
		});
	}

	showInvites(data: Array<I_User>) {
		for (const invite of data) {
			this.dialog
				.open(DialogInviteComponent, { data: { invite } })
				.afterClosed()
				.subscribe((result) => {
					if (result)
						this.userService.addFriend(invite).subscribe((data) => {
							if (HttpService.checkIsError(data)) {
								this.errorService.handleErrorSnackBar(data as I_Error);
								return;
							}

							this.addFriend(invite);
						});
					else if (result === false) {
						this.userService.removeFriend(invite).subscribe((data) => {
							if (HttpService.checkIsError(data)) {
								this.errorService.handleErrorSnackBar(data as I_Error);
								return;
							}

							this.removeFriend(invite);
						});
					}
				});
		}
	}

	isPending(user: I_User) {
		return this.pending.some((f) => user.id === f.id);
	}

	addFriend(invite: I_User) {
		if (!this.users) this.users = [];

		this.users.push(invite);
	}

	removeFriend(invite: I_User) {
		if (!this.iam) return;

		this.users = this.iam.friends.filter((f) => f.id !== invite.id);
	}
}
