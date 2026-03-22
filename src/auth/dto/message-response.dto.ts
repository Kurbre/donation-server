import { ApiProperty } from '@nestjs/swagger'

export class MessageResponseDto {
	@ApiProperty({ example: 'Сообщение тут' })
	message: string
}
