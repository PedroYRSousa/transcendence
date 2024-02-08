import { HttpModule } from '@nestjs/axios';
import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { UsersService } from './users.service';
import { userProviders } from './user.providers';
import { AuthService } from '../auth/auth.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { LoggerMiddleware } from 'src/middleware/logger/logger.middleware';
import { AuthMiddleware } from 'src/middleware/auth/auth.middleware';
import { chatProviders } from '../chat/chat.providers';
import { ChatService } from '../chat/chat.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { gameProviders } from '../game/game.providers';
import { scoreProviders } from '../game/score.providers';
import { GameService } from '../game/game.service';

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
	],
	controllers: [UsersController],
	providers: [
		...userProviders,
		...chatProviders,
		...gameProviders,
		...scoreProviders,
		GameService,
		ChatService,
		UsersService,
		AuthService,
		Logger,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class UsersModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(AuthMiddleware)
			.forRoutes(
				{ path: 'users', method: RequestMethod.PATCH },
				{ path: 'users/:id/removeFriend', method: RequestMethod.POST },
				{ path: 'users/:id/addFriend', method: RequestMethod.POST },
				{ path: 'users/:id/block', method: RequestMethod.POST },
				{ path: 'users/:id/unBlock', method: RequestMethod.POST },
				{ path: 'users/:id/invites', method: RequestMethod.GET },
				{ path: 'users/:id/chat', method: RequestMethod.GET },
				{ path: 'users/:id/chat/not', method: RequestMethod.GET },
			);
	}
}
