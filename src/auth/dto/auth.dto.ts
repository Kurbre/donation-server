import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

export class AuthDto {
	@ApiProperty({ example: 'test@gmail.com' })
	@IsEmail({}, { message: 'Email не валидный' })
	@IsNotEmpty({ message: 'Поле Email не может быть пустым' })
	@MinLength(2, { message: 'Минимальная длина Email 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина Email 64 символа' })
	email: string

	@ApiProperty({ example: 'qwerty123' })
	@IsNotEmpty({ message: 'Поле пароль не может быть пустым' })
	@IsString({ message: 'Поле пароль не являеться строкой' })
	@MinLength(6, { message: 'Минимальная длина пароля 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина пароля 32 символа' })
	password: string
}
