import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class ChangePasswordDto {
	@ApiProperty({ example: 'qwerty123' })
	@IsNotEmpty({ message: 'Поле пароль не может быть пустым' })
	@IsString({ message: 'Поле пароль не являеться строкой' })
	@MinLength(6, { message: 'Минимальная длина пароля 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина пароля 32 символа' })
	password: string
}
