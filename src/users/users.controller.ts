import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Auth } from 'src/auth/auth.decorator'
import { MessageResponseDto } from 'src/auth/dto/message-response.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { SendResetPasswordDto } from './dto/send-reset-password.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { GetUser } from './users.decorator'
import { UsersService } from './users.service'

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('send-reset-password')
	@ApiOperation({ summary: 'Отправка письма о сбросе пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		schema: {
			example: {
				message: 'Письмо отправлено'
			}
		},
		description: 'Письмо сброса пароля отправлено'
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		schema: {
			example: {
				message: 'Пользователь с таким Email не найден',
				error: 'Not found',
				statusCode: 404
			}
		},
		description: 'Пользователь не найден'
	})
	sendResetPassword(@Body() dto: SendResetPasswordDto) {
		return this.usersService.sendResetPassword(dto.email)
	}

	@Post('reset-password')
	@ApiOperation({ summary: 'Сброс пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пароль успешно изменен на новый',
		schema: {
			example: {
				message: 'Пароль успешно изменен на новый'
			}
		}
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Не верный токен либо не верный тип токена',
		schema: {
			example: {
				message: 'Токен не валидный',
				error: 'Unauthorized',
				statusCode: 401
			}
		}
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Просроченный токен',
		schema: {
			example: {
				message: 'Токен просрочен',
				error: 'Bad Request',
				statusCode: 400
			}
		}
	})
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.usersService.resetPassword(dto.token, dto.password)
	}

	@Auth()
	@Post('change-password')
	@ApiOperation({ summary: 'Смена пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пароль успешно изменен',
		schema: {
			example: {
				message: 'Пароль успешно изменен'
			}
		}
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Пользователь не авторизован',
		schema: {
			example: {
				message: 'Вы не авторизованы'
			}
		}
	})
	changePassword(
		@Body() dto: ChangePasswordDto,
		@GetUser('id') userId: string
	) {
		return this.usersService.changePassword(userId, dto.password)
	}

	@Auth()
	@Get('profile')
	@ApiOperation({ summary: 'Получить профиль' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Успешно получили профиль',
		type: UserResponseDto
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Пользователь не авторизован',
		schema: {
			example: {
				message: 'Вы не авторизованы'
			}
		}
	})
	getProfile(@GetUser('id') userId: string) {
		return this.usersService.findById(userId)
	}
}
