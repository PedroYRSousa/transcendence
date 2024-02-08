import { AfterViewChecked, AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DisplayComponent } from './components/display/display.component';
import { I_User, UserService } from '../../../../../../services/user/user.service';
import { I_Chat, I_Content } from '../../../../../../services/chat/chat.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DialogSettingsComponent } from './components/dialog-settings/dialog-settings.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorService } from '../../../../../../services/error/error.service';
import { WebsocketService } from '../../../../../../services/websocket/websocket.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../../../services/notification/notification.service';
import { EventsService } from '../../../../../../services/events/events.service';
import { WSChat } from '../../../../../../services/websocket/chat';

@Component({
	selector: 'app-content-chat',
	standalone: true,
	imports: [FormsModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule, DisplayComponent, MatDialogModule],
	templateUrl: './content-chat.component.html',
	styleUrl: './content-chat.component.scss',
})
export class ContentChatComponent implements OnChanges, AfterViewInit {
	@Input({ required: true }) public iam!: I_User;
	@Input({ required: true }) public chat: I_Chat | null = null;
	@Input({ required: true }) public loading: boolean = false;

	text: string = '';
	catImage: string = `/assets/cats/${(Date.now() % 8) + 1}.webp`;

	public get Iam() {
		return UserService.iam;
	}

	constructor(
		private readonly dialog: MatDialog,
		private readonly errorService: ErrorService,
		private readonly wsService: WebsocketService,
		private readonly notificationService: NotificationService,
	) {
		addEventListener(WSChat.eventNewMessage.type, (ev) => this.handleNewMessage(ev as CustomEvent));
		addEventListener(WSChat.eventMemberEnterInChat.type, (ev) => this.handleMemberEnterInChat(ev as CustomEvent));
		addEventListener(WSChat.eventMemberLeaveInChat.type, (ev) => this.handleMemberLeaveInChat(ev as CustomEvent));
	}

	ngAfterViewInit(): void {
		addEventListener(EventsService.eventExitChat.type, (ev) => this.handleExitChat(ev as CustomEvent));
	}

	handleMemberEnterInChat(ev: CustomEvent) {
		setTimeout(() => {
			const display = document.getElementById('display');

			if (!display) return;

			display.scrollTop = display.scrollHeight;
		}, 100);
	}

	handleMemberLeaveInChat(ev: CustomEvent) {
		setTimeout(() => {
			const display = document.getElementById('display');

			if (!display) return;

			display.scrollTop = display.scrollHeight;
		}, 100);
	}

	handleExitChat(ev: CustomEvent) {
		const { chat } = ev.detail as { chat: I_Chat };

		if (!chat) return;
		if (!this.chat) return;

		if (chat.id === this.chat.id) this.chat = null;
	}

	openSettings() {
		this.dialog
			.open(DialogSettingsComponent, { data: { chat: this.chat, iam: this.iam } })
			.afterClosed()
			.subscribe((data) => {
				if (!data) {
					return;
				}

				this.errorService.handleErrorSnackBar(data);
			});
	}

	ngOnChanges(changes: SimpleChanges): void {
		setTimeout(() => {
			const display = document.getElementById('display');

			if (!display) return;

			display.scrollTop = display.scrollHeight;
		}, 100);
	}

	sendMessage() {
		if (!this.text.trim()) this.text = '--- Mensagem Vazia ---';

		this.wsService.emitChat('sendMessage', { chat: this.chat, text: this.text.trim() });
		this.text = '';
	}

	handleNewMessage(ev: CustomEvent) {
		const { chat, content } = ev.detail as { chat: I_Chat; content: I_Content };

		if (this.chat && this.chat.id === chat.id)
			setTimeout(() => {
				const display = document.getElementById('display');
				if (!display) return;

				display.scrollTop = display.scrollHeight;
			}, 100);
		else if (content.author) {
			const notification = `[${chat.name}] ${content.author.displayName}: ${content.text}`;

			if (content.author && this.Iam && this.Iam.blocks.find((b) => b.id === content.author?.id)) {
				return;
			}
			this.notificationService.show(chat, notification);
		}
	}
}
