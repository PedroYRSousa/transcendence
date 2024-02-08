import { Component, Input, OnInit } from '@angular/core';

import { MessageComponent } from './components/message/message.component';
import { I_Chat, I_Content } from '../../../../../../../../services/chat/chat.service';
import { I_User, UserService } from '../../../../../../../../services/user/user.service';
import { WebsocketService } from '../../../../../../../../services/websocket/websocket.service';
import { WSChat } from '../../../../../../../../services/websocket/chat';

@Component({
	selector: 'app-display',
	standalone: true,
	imports: [MessageComponent],
	templateUrl: './display.component.html',
	styleUrl: './display.component.scss',
})
export class DisplayComponent implements OnInit {
	@Input({ required: true }) chat!: I_Chat;
	@Input({ required: true }) public iam!: I_User;

	public get Iam() {
		return UserService.iam;
	}

	constructor(private readonly wsService: WebsocketService) {}

	ngOnInit(): void {
		this.enterChat();

		addEventListener(WSChat.eventNewMessage.type, (ev) => this.handleNewMessage(ev as CustomEvent));
		addEventListener(WSChat.eventMemberEnterInChat.type, (ev) => this.handleMemberEnterInChat(ev as CustomEvent));
		addEventListener(WSChat.eventMemberLeaveInChat.type, (ev) => this.handleMemberLeaveInChat(ev as CustomEvent));
	}

	enterChat() {
		this.wsService.emitChat('enterChat', { chat: this.chat });
	}

	public handleMemberEnterInChat(ev: CustomEvent) {
		const user = ev.detail.user as I_User;

		this.chat.contents!.push({ text: `${user.displayName} Entrou no chat` });
	}

	public handleMemberLeaveInChat(ev: CustomEvent) {
		const user = ev.detail.user as I_User;

		this.chat.contents!.push({ text: `${user.displayName} Saiu do chat` });
	}

	public handleNewMessage(ev: CustomEvent) {
		if (!this.chat) return;

		const { chat, content } = ev.detail as { chat: I_Chat; content: I_Content };

		if (this.chat.id !== chat.id) return;

		this.chat.contents!.push(content);
	}
}
