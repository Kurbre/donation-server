import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

export class ResetPasswordDto {
	@IsNotEmpty({ message: 'Поле токен не может быть пустым' })
	@IsString({ message: 'Поле токен не являеться строкой' })
	token: string

	@IsNotEmpty({ message: 'Поле пароль не может быть пустым' })
	@IsString({ message: 'Поле пароль не являеться строкой' })
	@MinLength(6, { message: 'Минимальная длина пароля 6 символов' })
	@MaxLength(32, { message: 'Максимальная длина пароля 32 символа' })
	password: string
}
