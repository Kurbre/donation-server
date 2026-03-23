import { ApiProperty } from '@nestjs/swagger'

export class MessageResponseDto {
	@ApiProperty({ example: 'Пример сообщения' })
	message: string
}
