import {
	IsBoolean,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString
} from 'class-validator'

export class UpdateNoteDto {
	@IsString({ message: 'Заголовок должен быть строкой' })
	@IsOptional()
	title?: string

	@IsString({ message: 'Текст должен быть строкой' })
	@IsOptional()
	text?: string

	@IsBoolean({ message: 'Режим редактирования должен быть булевым значением' })
	@IsOptional()
	isEditMode?: boolean
}
