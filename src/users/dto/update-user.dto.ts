import { ApiProperty } from '@nestjs/swagger'
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator'

export class UpdateUserDto {
	@ApiProperty({ example: 'John' })
	@IsOptional({ message: '' })
	@IsNotEmpty({ message: 'Поле имя не может быть пустым' })
	@IsString({ message: 'Поле имя не являеться строкой' })
	@MinLength(2, { message: 'Минимальная длина имени 2 символа' })
	@MaxLength(32, { message: 'Максимальная длина имени 64 символа' })
	name?: string

	@ApiProperty({ example: 'Dante' })
	@IsOptional()
	@IsNotEmpty({ message: 'Поле фамилия не может быть пустым' })
	@IsString({ message: 'Поле фамилия не являеться строкой' })
	@MinLength(2, { message: 'Минимальная длина фамилии 2 символа' })
	@MaxLength(32, { message: 'Максимальная длина фамилии 64 символа' })
	surname?: string
}
