import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';

import { Messages } from './websocket.messages';
import { AuthService } from 'src/controllers/auth/auth.service';
import { UsersService } from 'src/controllers/users/users.service';
import { ChatService } from 'src/controllers/chat/chat.service';
import { ContentService } from 'src/controllers/content/content.service';
import { GameService } from 'src/controllers/game/game.service';

@WebSocketGateway()
export class Gateway extends Messages implements OnGatewayDisconnect, OnGatewayConnection {
	constructor(
		protected readonly logger: Logger,
		protected readonly chatService: ChatService,
		protected readonly authService: AuthService,
		protected readonly usersService: UsersService,
		protected readonly contentService: ContentService,
		protected readonly gameService: GameService,
	) {
		super(logger, chatService, authService, usersService, contentService, gameService);
	}
}
