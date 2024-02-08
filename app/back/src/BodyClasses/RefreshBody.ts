import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshBody {
	@IsString()
	@IsNotEmpty()
	refresh_token: string;
}
