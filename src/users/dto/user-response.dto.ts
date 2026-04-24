import { ApiProperty } from '@nestjs/swagger'

export class UserResponseDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	name: string

	@ApiProperty()
	surname: string

	@ApiProperty()
	email: string

	@ApiProperty()
	avatarPath: string

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}
