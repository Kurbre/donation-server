import {
	Body,
	Controller,
	Get,
	HttpStatus,
	Post,
	Query,
	Req,
	Res
} from '@nestjs/common'
import { type Request, type Response } from 'express'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { MessageResponseDto } from './dto/message-response.dto'
import { UserResponseDto } from 'src/users/dto/user-response.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Регистрация пользователя' })
	@ApiBody({ type: CreateUserDto })
	@ApiResponse({
		status: HttpStatus.OK,
		schema: {
			example: {
				message: 'Письмо отправлено'
			}
		},
		description: 'Письмо подтверждения отправлено'
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: 'Пользователь с таким email уже зарегестрирован',
		schema: {
			example: {
				message: 'Пользователь с таким email уже зарегестрирован',
				error: 'Bad Request',
				statusCode: 400
			}
		}
	})
	register(@Body() dto: CreateUserDto) {
		return this.authService.register(dto)
	}

	@Post('confirmed-register')
	@ApiOperation({ summary: 'Подтверждение регистрации по токену' })
	@ApiQuery({ name: 'token', description: 'Токен из письма', required: true })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пользователь подтвержден и залогинен',
		type: UserResponseDto
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Не верный токен',
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
	confirmedRegister(@Query('token') token: string, @Req() req: Request) {
		return this.authService.confirmedRegister(token, req)
	}

	@Post('login')
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiBody({ type: AuthDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Пользователь залогинен',
		type: UserResponseDto
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Неверный email или пароль',
		schema: {
			example: {
				message: 'Email или пароль не правильные',
				error: 'Unauthorized',
				statusCode: 401
			}
		}
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
	login(@Body() dto: AuthDto, @Req() req: Request) {
		return this.authService.login(dto, req)
	}

	@Post('logout')
	@ApiOperation({ summary: 'Выход пользователя' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Вы успешно вышли',
		schema: {
			example: {
				message: 'Вы успешно вышли из аккаунта.'
			}
		}
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: 'Пользователь не авторизован',
		schema: {
			example: {
				message: 'Вы не авторизованы, чтобы выйти из аккаунта.',
				error: 'Unauthorized',
				statusCode: 401
			}
		}
	})
	@ApiResponse({
		status: HttpStatus.INTERNAL_SERVER_ERROR,
		description: 'Не удалось выйти из аккаунта',
		schema: {
			example: {
				message: 'Не удалось выйти из аккаунта.',
				error: 'Internal server error',
				statusCode: 500
			}
		}
	})
	logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
		return this.authService.logout(req, res)
	}
}
