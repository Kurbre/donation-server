import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

export class CreateNoteDto {
	@IsEmail({}, { message: 'Email не валидный' })
	@IsString({ message: 'Email должен быть строкой' })
	@IsNotEmpty({ message: 'Email не может быть пустым' })
	title: string

	@IsString({ message: 'Пароль должен быть строкой' })
	@IsNotEmpty({ message: 'Пароль не может быть пустым' })
	text: string

	@IsNotEmpty({ message: 'Логин не может быть пустым' })
	@IsString({ message: 'Логин должен быть строкой' })
	login: string
}
