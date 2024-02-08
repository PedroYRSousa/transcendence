import { HttpModule } from '@nestjs/axios';
import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { userProviders } from '../users/user.providers';
import { FileService } from 'src/services/file/file.service';
import { DatabaseModule } from 'src/database/database.module';
import { CacheService } from 'src/services/cache/cache.service';
import { AuthMiddleware } from 'src/middleware/auth/auth.middleware';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
	controllers: [AuthController],
	providers: [
		...userProviders,
		UsersService,
		AuthService,
		CacheService,
		FileService,
		Logger,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AuthModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(AuthMiddleware)
			.forRoutes(
				{ path: 'auth/my', method: RequestMethod.GET },
				{ path: 'auth', method: RequestMethod.POST },
				{ path: 'auth/refresh', method: RequestMethod.POST },
				{ path: 'auth/generateTwoFactor', method: RequestMethod.POST },
				{ path: 'auth/activeTwoFactor', method: RequestMethod.POST },
				{ path: 'auth/deactivateTwoFactor', method: RequestMethod.POST },
			);
	}
}
