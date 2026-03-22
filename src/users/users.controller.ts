import { Body, Controller, Post, Query } from '@nestjs/common'
import { SendResetPasswordDto } from './dto/send-reset-password.dto'
import { UsersService } from './users.service'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('send-reset-password')
	sendResetPassword(@Body() dto: SendResetPasswordDto) {
		return this.usersService.sendResetPassword(dto.email)
	}

	@Post('reset-password')
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.usersService.resetPassword(dto.token, dto.password)
	}
}
