import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	Req,
	Res
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { type Request, type Response } from 'express'
import { USERS_ERRORS } from 'src/users/constants/users-errors'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { UserResponseDto } from 'src/users/dto/user-response.dto'
import { ErrorApiResponse } from 'src/utils/decorators/error-api-response.decorator'
import { MessageResponseDto } from '../utils/dto/message-response.dto'
import { AuthService } from './auth.service'
import { AUTH_ERRORS } from './constants/auth-errors'
import { AuthDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Регистрация пользователя' })
	@ApiBody({ type: CreateUserDto })
	@ApiResponse({
		status: HttpStatus.OK,
		type: MessageResponseDto,
		description: 'Письмо подтверждения отправлено'
	})
	register(@Body() dto: CreateUserDto) {
		return this.authService.register(dto)
	}

	@Post('confirmed-register')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Подтверждение регистрации по токену' })
	@ApiQuery({ name: 'token', description: 'Токен из письма', required: true })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Пользователь подтвержден и зарегистрирован',
		type: UserResponseDto
	})
	@ErrorApiResponse(
		HttpStatus.UNAUTHORIZED,
		'Неверный токен',
		AUTH_ERRORS.INVALID_TOKEN
	)
	@ErrorApiResponse(
		HttpStatus.BAD_REQUEST,
		'Просроченный токен',
		AUTH_ERRORS.TOKEN_EXPIRED
	)
	confirmedRegister(@Query('token') token: string, @Req() req: Request) {
		return this.authService.confirmedRegister(token, req)
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiBody({ type: AuthDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пользователь залогинен',
		type: UserResponseDto
	})
	@ErrorApiResponse(
		HttpStatus.UNAUTHORIZED,
		'Неверный email или пароль',
		AUTH_ERRORS.INVALID_CREDENTIALS
	)
	@ErrorApiResponse(
		HttpStatus.NOT_FOUND,
		'Пользователь не найден',
		USERS_ERRORS.NOT_FOUND_EMAIL
	)
	login(@Body() dto: AuthDto, @Req() req: Request) {
		return this.authService.login(dto, req)
	}

	@Post('logout')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Выход пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Вы успешно вышли',
		type: MessageResponseDto
	})
	@ErrorApiResponse(
		HttpStatus.UNAUTHORIZED,
		'Пользователь не авторизован',
		AUTH_ERRORS.UNAUTHORIZED_LOGOUT
	)
	@ErrorApiResponse(
		HttpStatus.INTERNAL_SERVER_ERROR,
		'Не удалось выйти из аккаунта',
		AUTH_ERRORS.BAD_LOGOUT
	)
	logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
		return this.authService.logout(req, res)
	}
}
