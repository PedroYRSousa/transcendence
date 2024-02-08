import { Logger, Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { contentProviders } from './content.providers';
import { DatabaseModule } from 'src/database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
	imports: [
		DatabaseModule,
		ThrottlerModule.forRoot([
			{
				ttl: 1,
				limit: 1000,
			},
		]),
	],
	controllers: [ContentController],
	providers: [
		...contentProviders,
		ContentService,
		Logger,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class ContentModule {}
