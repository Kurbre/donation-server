import { ApiProperty } from '@nestjs/swagger'

export class ErrorResponseDto {
	message: string
	error: string
	statusCode: number
}
