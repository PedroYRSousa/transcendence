import { IsNotEmpty, IsString, IsNumber, IsEmail } from 'class-validator';

export class UserDto {
	@IsNumber()
	@IsNotEmpty()
	id: number;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	displayName: string;

	image: string | null;
}
