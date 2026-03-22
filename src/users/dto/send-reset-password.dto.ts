import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator'

export class SendResetPasswordDto {
	@ApiProperty({ example: 'test@gmail.com' })
	@IsEmail({}, { message: 'Email не валидный' })
	@IsNotEmpty({ message: 'Поле Email не может быть пустым' })
	@MinLength(2, { message: 'Минимальная длина Email 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина Email 64 символа' })
	email: string
}
