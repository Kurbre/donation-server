import { Body, Controller, Post, Query } from '@nestjs/common'
import { SendResetPasswordDto } from './dto/send-reset-password.dto'
import { UsersService } from './users.service'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MessageResponseDto } from 'src/auth/dto/message-response.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { Auth } from 'src/auth/auth.decorator'
import { GetUser } from './users.decorator'

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('send-reset-password')
	@ApiOperation({ summary: 'Отправка письма о сбросе пароля' })
	@ApiResponse({
		status: 200,
		type: MessageResponseDto,
		description: 'Письмо сброса пароля отправлено'
	})
	sendResetPassword(@Body() dto: SendResetPasswordDto) {
		return this.usersService.sendResetPassword(dto.email)
	}

	@Post('reset-password')
	@ApiOperation({ summary: 'Сброс пароля' })
	@ApiResponse({
		status: 200,
		type: MessageResponseDto,
		description: 'Пароль успешно изменен на новый'
	})
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.usersService.resetPassword(dto.token, dto.password)
	}

	@Auth()
	@Post('change-password')
	@ApiOperation({ summary: 'Смена пароля' })
	@ApiResponse({
		status: 200,
		type: MessageResponseDto,
		description: 'Пароль успешно изменен'
	})
	changePassword(
		@Body() dto: ChangePasswordDto,
		@GetUser('id') userId: string
	) {
		return this.usersService.changePassword(userId, dto.password)
	}
}
