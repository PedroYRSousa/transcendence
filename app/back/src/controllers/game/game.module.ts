import { Logger, Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { gameProviders } from './game.providers';
import { APP_GUARD } from '@nestjs/core';
import { scoreProviders } from './score.providers';
import { userProviders } from '../users/user.providers';
import { chatProviders } from '../chat/chat.providers';
import { UsersService } from '../users/users.service';

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
	controllers: [GameController],
	providers: [
		...gameProviders,
		...scoreProviders,
		...userProviders,
		...chatProviders,
		UsersService,
		GameService,
		Logger,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class GameModule {}
