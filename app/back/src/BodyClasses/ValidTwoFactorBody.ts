import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidTwoFactorBody {
	@IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
	@IsNotEmpty()
	twoFactorCode: number;

	@IsString()
	@IsNotEmpty()
	hashed_id: string;
}
