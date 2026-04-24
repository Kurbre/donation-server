import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
	MinLength
} from 'class-validator'

export class UpdateUserDto {
	@ApiProperty({ example: 'John' })
	@IsOptional({ message: '' })
	@IsString({ message: 'Поле имя не являеться строкой' })
	@MinLength(2, { message: 'Минимальная длина имени 2 символа' })
	@MaxLength(32, { message: 'Максимальная длина имени 64 символа' })
	name?: string

	@ApiProperty({ example: 'Dante' })
	@IsOptional()
	@IsString({ message: 'Поле фамилия не являеться строкой' })
	@MinLength(2, { message: 'Минимальная длина фамилии 2 символа' })
	@MaxLength(32, { message: 'Максимальная длина фамилии 64 символа' })
	surname?: string

	@ApiProperty({ example: 'https://example.url/avatar.png' })
	@IsOptional()
	@IsString({ message: 'Поле ссылка на аватарку не являеться строкой' })
	@IsUrl({}, { message: 'Ссылка на аватарку не валидна' })
	avatarPath?: string
}
