import { Component } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../app.component';
import { HttpService } from '../../../../services/http/http.service';
import { ErrorService } from '../../../../services/error/error.service';
import { I_User, UserService } from '../../../../services/user/user.service';
import { ChatService, I_Chat } from '../../../../services/chat/chat.service';
import { ListChatComponent } from './components/list-chat/list-chat.component';
import { ContentChatComponent } from './components/content-chat/content-chat.component';

@Component({
	selector: 'app-chat',
	standalone: true,
	imports: [MatProgressSpinnerModule, ListChatComponent, ContentChatComponent],
	templateUrl: './chat.component.html',
	styleUrl: './chat.component.scss',
})
export class ChatComponent {
	public loading: boolean = false;
	public iam: I_User | null = null;
	public selectedChat: I_Chat | null = null;

	constructor(private readonly userService: UserService, private readonly chatService: ChatService, private readonly errorService: ErrorService) {}

	ngOnInit(): void {
		if (!UserService.iam) this.getMy();
		else this.iam = UserService.iam;
	}

	closeChat(message: string) {
		if (!message) return;

		this.errorService.handleErrorSnackBar({ error: message });
		this.selectedChat = null;
	}

	getMy() {
		this.userService.my().subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorLogout(data as I_Error);
				return;
			}

			this.iam = data as I_User;
		});
	}

	getChat(chat: I_Chat | null) {
		if (!chat) {
			this.selectedChat = chat;
			return;
		}

		this.loading = true;

		this.chatService.get(chat.id).subscribe((data) => {
			this.loading = false;

			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorSnackBar(data as I_Error);
				return;
			}

			if ((data as I_Chat).kicks.includes(this.iam!.id)) {
				this.errorService.handleErrorSnackBar({ error: 'Usuário banido do chat' });
				return;
			}
			if ((data as I_Chat).members!.filter((m) => m.id === this.iam!.id).length <= 0) {
				this.errorService.handleErrorSnackBar({ error: 'Usuário removido do chat' });
				return;
			}

			this.selectedChat = data as I_Chat;
		});
	}
}
