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
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { UserResponseDto } from 'src/users/dto/user-response.dto'
import { ErrorApiResponse } from 'src/utils/decorators/error-api-response.decorator'
import { MessageResponseDto } from '../utils/dto/message-response.dto'
import { AuthService } from './auth.service'
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
	@ErrorApiResponse(
		HttpStatus.BAD_REQUEST,
		'Пользователь с таким email уже зарегистрирован',
		'Пользователь с таким email уже зарегистрирован'
	)
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
		'Токен не валидный'
	)
	@ErrorApiResponse(
		HttpStatus.BAD_REQUEST,
		'Просроченный токен',
		'Токен просрочен'
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
		'Email или пароль не правильные'
	)
	@ErrorApiResponse(
		HttpStatus.NOT_FOUND,
		'Пользователь не найден',
		'Пользователь с таким Email не найден'
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
		'Вы не авторизованы, чтобы выйти из аккаунта.'
	)
	@ErrorApiResponse(
		HttpStatus.INTERNAL_SERVER_ERROR,
		'Не удалось выйти из аккаунта',
		'Не удалось выйти из аккаунта.'
	)
	logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
		return this.authService.logout(req, res)
	}
}
