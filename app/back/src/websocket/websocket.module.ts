import { APP_GUARD } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { Logger, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { Gateway } from './websocket.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { AuthService } from 'src/controllers/auth/auth.service';
import { ChatService } from 'src/controllers/chat/chat.service';
import { UsersService } from 'src/controllers/users/users.service';
import { chatProviders } from 'src/controllers/chat/chat.providers';
import { userProviders } from 'src/controllers/users/user.providers';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ContentService } from 'src/controllers/content/content.service';
import { contentProviders } from 'src/controllers/content/content.providers';
import { GameService } from 'src/controllers/game/game.service';
import { gameProviders } from 'src/controllers/game/game.providers';
import { scoreProviders } from 'src/controllers/game/score.providers';

@Module({
	imports: [
		HttpModule,
		DatabaseModule,
		ThrottlerModule.forRoot([
			{
				ttl: 1,
				limit: 1000,
			},
		]),
		EventEmitterModule.forRoot(),
	],
	providers: [
		...userProviders,
		...chatProviders,
		...contentProviders,
		...gameProviders,
		...scoreProviders,
		Logger,
		Gateway,
		AuthService,
		ChatService,
		UsersService,
		GameService,
		ContentService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class WebsocketModule {}
