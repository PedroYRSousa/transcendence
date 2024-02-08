import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

/**
 * The function sets up a Nest.js application with global prefixes, global pipes for validation, and
 * body parsers, and then listens for incoming requests on port 3000.
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Para diferenciar a api do front.
	app.setGlobalPrefix('api');

	// Validador de classe
	app.useGlobalPipes(new ValidationPipe());

	// Para os arquivos que são feitos upload
	app.use(bodyParser.json({ limit: '50mb' }));
	app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

	await app.listen(10000);
}

bootstrap();
