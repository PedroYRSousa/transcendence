import { Injectable } from '@angular/core';
import { I_Chat } from '../chat/chat.service';

@Injectable({
	providedIn: 'root',
})
export class EventsService {
	constructor() {}

	public static readonly eventSendDM: CustomEvent = new CustomEvent('onSendDM', { detail: { chat: null as I_Chat | null } });
	public static readonly eventExitChat: CustomEvent = new CustomEvent('onExitChat', { detail: { chat: null as I_Chat | null } });
	public static readonly eventOpenDM: CustomEvent = new CustomEvent('onOpenDM', { detail: { chat: null as I_Chat | null } });
	public static readonly eventClickNotification: CustomEvent = new CustomEvent('onClickNotification', { detail: { chat: null as I_Chat | null } });
}
