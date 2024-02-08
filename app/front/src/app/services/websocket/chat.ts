import { I_Chat, I_Content } from '../chat/chat.service';
import { I_User } from '../user/user.service';
import { ErrorService } from '../error/error.service';
import { I_Error } from '../../app.component';

export class WSChat {
	public static readonly eventMemberEnterInChat = new CustomEvent('onMemberEnterInChat', { detail: { user: null as I_User | null } });
	public static readonly eventMemberLeaveInChat = new CustomEvent('onMemberLeaveInChat', { detail: { user: null as I_User | null } });
	public static readonly eventNewMessage = new CustomEvent('eventNewMessage', { detail: { content: null as I_Content | null, chat: null as I_Chat | null } });
	public static readonly eventOpenGameView = new CustomEvent('onOpenGameView', { detail: {} });

	constructor(private readonly errorService: ErrorService) {}

	public error(data: I_Error) {
		this.errorService.handleErrorSnackBar(data);
	}

	public memberEnterInChat(data: I_User) {
		WSChat.eventMemberEnterInChat.detail.user = data;
		dispatchEvent(WSChat.eventMemberEnterInChat);
	}

	public memberLeaveInChat(data: I_User) {
		WSChat.eventMemberLeaveInChat.detail.user = data;
		dispatchEvent(WSChat.eventMemberLeaveInChat);
	}

	public newMessage(data: any) {
		WSChat.eventNewMessage.detail.content = data.content;
		WSChat.eventNewMessage.detail.chat = data.chat;
		dispatchEvent(WSChat.eventNewMessage);
	}

	public openGameView() {
		dispatchEvent(WSChat.eventOpenGameView);
	}
}
