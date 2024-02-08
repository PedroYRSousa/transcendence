import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

import { User } from 'src/controllers/users/entities/user.entity';

export class ChatDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsBoolean()
	@IsNotEmpty()
	public: boolean;

	@IsBoolean()
	@IsNotEmpty()
	protected: boolean;

	@IsString()
	@IsOptional()
	password: string | null;

	owner: number;
	salt: string | null;
	members: User[];
	isDM: boolean = false;
}
