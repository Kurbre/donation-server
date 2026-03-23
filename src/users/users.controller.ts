import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Auth } from 'src/auth/auth.decorator'
import { MessageResponseDto } from 'src/utils/dto/message-response.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { SendResetPasswordDto } from './dto/send-reset-password.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { GetUser } from './decorators/users.decorator'
import { UsersService } from './users.service'
import { ErrorResponseDto } from 'src/utils/dto/error-response.dto'
import { ErrorApiResponse } from './decorators/error-api-response.decorator'

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('send-reset-password')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Отправка письма о сбросе пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		type: MessageResponseDto,
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
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Сброс пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пароль успешно изменен на новый',
		type: MessageResponseDto
	})
	@ErrorApiResponse(
		HttpStatus.UNAUTHORIZED,
		'Не верный токен либо не верный тип токена',
		'Токен не валидный'
	)
	@ErrorApiResponse(
		HttpStatus.BAD_REQUEST,
		'Просроченный токен',
		'Токен просрочен'
	)
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.usersService.resetPassword(dto)
	}

	@Auth()
	@Post('change-password')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Смена пароля' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пароль успешно изменен',
		type: MessageResponseDto
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
	@HttpCode(HttpStatus.OK)
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
