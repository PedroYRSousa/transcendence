import { AfterViewInit, Component, OnInit } from '@angular/core';

import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { ResumeProfileComponent } from '../resume-profile/resume-profile.component';
import { I_Chat, I_Content } from '../../../../services/chat/chat.service';
import { NotificationService } from '../../../../services/notification/notification.service';
import { WebsocketService } from '../../../../services/websocket/websocket.service';
import { WSChat } from '../../../../services/websocket/chat';

@Component({
	selector: 'app-users',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatListModule, ResumeProfileComponent, MatSnackBarModule],
	templateUrl: './users.component.html',
	styleUrl: './users.component.scss',
})
export class UsersComponent implements AfterViewInit {
	public users: I_User[] | null = null;

	constructor(private readonly userService: UserService, private readonly errorService: ErrorService, private readonly notificationService: NotificationService) {
		this.listUsers();
	}

	public get Iam() {
		return UserService.iam;
	}

	ngAfterViewInit(): void {
		addEventListener(WSChat.eventNewMessage.type, (ev) => this.handleNewMessage(ev as CustomEvent));
	}

	handleNewMessage(ev: CustomEvent) {
		if (window.location.href.includes('/chat')) return;

		const { chat, content } = ev.detail as { chat: I_Chat; content: I_Content };

		if (content.author && this.Iam && this.Iam.blocks.find((b) => b.id === content.author?.id)) {
			return;
		}

		if (content.author) {
			const notification = `[${chat.name}] ${content.author.displayName}: ${content.text}`;

			this.notificationService.show(chat, notification);
		}
	}

	listUsers() {
		if (!this.Iam) {
			setTimeout(() => this.listUsers(), 100);
			return;
		}

		this.userService.list().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorSnackBar(data as I_Error);
				this.users = [];
				return;
			}

			this.users = (data as I_User[]).filter((user) => user.id !== this.Iam!.id);
		});
	}
}
