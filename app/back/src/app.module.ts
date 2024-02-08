import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthModule } from './controllers/auth/auth.module';
import { ChatModule } from './controllers/chat/chat.module';
import { UsersModule } from './controllers/users/users.module';
import { ContentModule } from './controllers/content/content.module';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';
import { WebsocketModule } from './websocket/websocket.module';
import { APP_GUARD } from '@nestjs/core';
import { GameModule } from './controllers/game/game.module';

function configServeStaticFront() {
	return {
		rootPath: process.env.FRONT_PATH,
		exclude: ['/api/(.*)', '/assets/(.*)', '/public/(.*)'],
	};
}

function configServeStaticPublic() {
	return {
		renderPath: 'public',
		rootPath: process.env.BACK_PATH,
		exclude: ['/api/(.*)', '/assets/(.*)'],
	};
}

function configServeStaticAssets() {
	return {
		renderPath: 'assets',
		rootPath: join(process.env.FRONT_PATH, 'assets'),
		exclude: ['/api/(.*)', '/public/(.*)'],
	};
}

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				ttl: 1,
				limit: 1000,
			},
		]),
		ConfigModule.forRoot({ envFilePath: `${!process.env.NODE_ENV && process.env.NODE_ENV !== 'prod' ? '.env.dev' : '.env'}` }),
		ServeStaticModule.forRoot(configServeStaticFront()),
		ServeStaticModule.forRoot(configServeStaticPublic()),
		ServeStaticModule.forRoot(configServeStaticAssets()),
		UsersModule,
		AuthModule,
		ChatModule,
		GameModule,
		ContentModule,
		WebsocketModule,
		GameModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes('*');
	}
}
