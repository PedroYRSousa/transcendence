import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Chat } from 'src/controllers/chat/entities/chat.entity';

import { User } from 'src/controllers/users/entities/user.entity';

export class CreateContentDto {
	@IsString()
	@IsNotEmpty()
	text: string;

	@IsNotEmpty()
	chat: Chat;

	@IsNotEmpty()
	author: User;
}
