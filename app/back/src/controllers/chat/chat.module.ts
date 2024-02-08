import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatActionController, ChatController } from './chat.controller';
import { DatabaseModule } from 'src/database/database.module';
import { chatProviders } from './chat.providers';
import { AuthMiddleware } from 'src/middleware/auth/auth.middleware';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { userProviders } from '../users/user.providers';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

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
	controllers: [ChatController, ChatActionController],
	providers: [
		...chatProviders,
		...userProviders,
		UsersService,
		AuthService,
		ChatService,
		Logger,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class ChatModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(AuthMiddleware)
			.forRoutes(
				{ path: 'chat', method: RequestMethod.POST },
				{ path: 'chat/dm', method: RequestMethod.POST },
				{ path: 'chat/:id', method: RequestMethod.PATCH },
				{ path: 'chat/:id', method: RequestMethod.DELETE },
				{ path: 'action/chat/dm/:id', method: RequestMethod.GET },
				{ path: 'action/chat/enter', method: RequestMethod.POST },
				{ path: 'action/chat/exit', method: RequestMethod.POST },
				{ path: 'action/chat/addAdmin', method: RequestMethod.POST },
				{ path: 'action/chat/removeAdmin', method: RequestMethod.POST },
				{ path: 'action/chat/removeMember', method: RequestMethod.POST },
				{ path: 'action/chat/kick', method: RequestMethod.POST },
				{ path: 'action/chat/unKick', method: RequestMethod.POST },
				{ path: 'action/chat/mute', method: RequestMethod.POST },
				{ path: 'action/chat/unMute', method: RequestMethod.POST },
			);
	}
}
