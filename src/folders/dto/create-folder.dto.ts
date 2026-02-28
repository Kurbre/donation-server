import { IsNotEmpty, IsString } from 'class-validator'

export class CreateFolderDto {
	@IsString({ message: 'Название должно быть строкой' })
	@IsNotEmpty({ message: 'Название не должно быть пустым' })
	title: string
}
