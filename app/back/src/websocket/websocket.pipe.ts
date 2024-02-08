import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class testeChatPipe implements PipeTransform<any> {
	transform(value: any, metadata: ArgumentMetadata) {
		if (value instanceof Socket) return value;

		if (!value) {
			throw new BadRequestException('Valor inválido');
		}

		return value;
	}
}

@Injectable()
export class testeGamePipe implements PipeTransform<any> {
	transform(value: any, metadata: ArgumentMetadata) {
		if (value instanceof Socket) return value;

		if (!value) {
			throw new BadRequestException('Valor inválido');
		}

		return value;
	}
}
