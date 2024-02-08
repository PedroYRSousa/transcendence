import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Para diferenciar a api do front.
	app.setGlobalPrefix('api');

	// Validador de classe
	app.useGlobalPipes(new ValidationPipe());

	// Para os arquivos que são feitos upload
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

	await app.listen(process.env.PORT || 4000);
}

bootstrap();
