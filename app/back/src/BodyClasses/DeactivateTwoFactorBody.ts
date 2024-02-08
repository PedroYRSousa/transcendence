import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeactivateTwoFactorBody {
	@IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
	@IsNotEmpty()
	twoFactorCode: number;
}
