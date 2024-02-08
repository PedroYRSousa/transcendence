import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I_Error } from '../../../../../../app.component';
import { I_User } from '../../../../../../services/user/user.service';
import { HttpService } from '../../../../../../services/http/http.service';
import { ErrorService } from '../../../../../../services/error/error.service';
import { ListItemComponent } from './components/list-item/list-item.component';
import { ChatService, I_Chat } from '../../../../../../services/chat/chat.service';
import { DialogSearchChatComponent } from './components/dialog-search-chat/dialog-search-chat.component';
import { DialogCreateChatComponent } from './components/dialog-create-chat/dialog-create-chat.component';
import { WebsocketService } from '../../../../../../services/websocket/websocket.service';
import { EventsService } from '../../../../../../services/events/events.service';
import { RoutesService } from '../../../../../../services/routes/routes.service';

@Component({
	selector: 'app-list-chat',
	standalone: true,
	imports: [MatProgressSpinnerModule, MatButtonModule, MatIconModule, ListItemComponent, MatDialogModule],
	templateUrl: './list-chat.component.html',
	styleUrl: './list-chat.component.scss',
})
export class ListChatComponent implements AfterViewInit {
	@Input({ required: true }) iam!: I_User;
	@Output() getChat = new EventEmitter();
	chats: I_Chat[] | null = null;
	selectedChat: I_Chat | null = null;

	constructor(
		private readonly dialog: MatDialog,
		private readonly chatService: ChatService,
		private readonly errorService: ErrorService,
		private readonly wsService: WebsocketService,
	) {}

	ngAfterViewInit(): void {
		addEventListener(EventsService.eventOpenDM.type, (ev) => this.handleOpenDM(ev as CustomEvent));
		addEventListener(EventsService.eventClickNotification.type, (ev) => this.handleClickNotification(ev as CustomEvent));
		addEventListener(EventsService.eventExitChat.type, (ev) => this.handleExitChat(ev as CustomEvent));
		this.listChats();
	}

	handleExitChat(ev: CustomEvent) {
		const { chat } = ev.detail as { chat: I_Chat };

		if (!chat) return;
		if (!this.chats) return;
		if (!this.selectedChat) return;

		if (chat.id === this.selectedChat.id) this.selectedChat = null;
		this.chats = this.chats?.filter((c) => c.id !== chat.id);
	}

	handleOpenDM(ev: CustomEvent) {
		const { chat } = ev.detail as { chat: I_Chat };

		if (!chat) return;
		if (chat.id === this.selectedChat?.id) return;

		this.selectChat(chat);
	}

	handleClickNotification(ev: CustomEvent) {
		const { chat } = ev.detail as { chat: I_Chat };

		if (!chat) return;
		if (chat.id === this.selectedChat?.id) return;

		this.selectChat(chat);
	}

	listChats() {
		this.chatService.listMyChats(this.iam.id).subscribe((data) => {
			if (HttpService.checkIsError(data)) {
				this.errorService.handleErrorSnackBar(data as I_Error);
				return;
			}

			this.chats = data as I_Chat[];
		});
	}

	createChat() {
		this.dialog
			.open(DialogCreateChatComponent, { data: {} })
			.afterClosed()
			.subscribe((data) => {
				if (!data) {
					this.listChats();
					return;
				}

				this.errorService.handleErrorLogoutOrSnackBar(data);
			});
	}

	searchChat() {
		this.dialog
			.open(DialogSearchChatComponent, { data: { iam: this.iam } })
			.afterClosed()
			.subscribe((data) => {
				if (!data) {
					this.listChats();
					return;
				}

				this.errorService.handleErrorLogoutOrSnackBar(data);
			});
	}

	refreshList() {
		this.chats = null;

		this.listChats();
	}

	selectChat(chat: I_Chat | null) {
		if (chat === this.selectedChat && this.selectedChat !== null) chat = null;

		if (chat === null && this.selectedChat !== null) this.wsService.emitChat('leaveChat', { chat: this.selectedChat });
		this.selectedChat = chat;
		this.getChat.emit(this.selectedChat);
	}
}
