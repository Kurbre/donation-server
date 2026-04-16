import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class ResetPasswordDto {
	@ApiProperty({ example: 'hshfjsdhjf-fdshfdsjh-fdshhfsjd-sdfhsdfhsdf' })
	@IsNotEmpty({ message: 'Поле токен не может быть пустым' })
	@IsString({ message: 'Поле токен не являеться строкой' })
	token: string

	@ApiProperty({ example: 'qwerty123' })
	@IsNotEmpty({ message: 'Поле пароль не может быть пустым' })
	@IsString({ message: 'Поле пароль не являеться строкой' })
	@MinLength(6, { message: 'Минимальная длина пароля 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина пароля 32 символа' })
	password: string
}
