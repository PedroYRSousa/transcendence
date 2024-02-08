import { IsNotEmpty, IsNumber } from 'class-validator';

export class ActiveTwoFactorBody {
	@IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
	@IsNotEmpty()
	twoFactorCode: number;
}
