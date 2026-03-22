import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common'
import { type Request, type Response } from 'express'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { MessageResponseDto } from './dto/message-response.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Регистрация пользователя' })
	@ApiBody({ type: CreateUserDto })
	@ApiResponse({
		status: 200,
		type: MessageResponseDto,
		description: 'Письмо подтверждения отправлено'
	})
	register(@Body() dto: CreateUserDto) {
		return this.authService.register(dto)
	}

	@Post('confirmed-register')
	@ApiOperation({ summary: 'Подтверждение регистрации по токену' })
	@ApiQuery({ name: 'token', description: 'Токен из письма', required: true })
	@ApiResponse({
		status: 200,
		description: 'Пользователь подтвержден и залогинен'
	})
	@ApiResponse({ status: 401, description: 'Токен не валидный' })
	confirmedRegister(@Query('token') token: string, @Req() req: Request) {
		return this.authService.confirmedRegister(token, req)
	}

	@Post('login')
	@ApiOperation({ summary: 'Вход пользователя' })
	@ApiBody({ type: AuthDto })
	@ApiResponse({ status: 200, description: 'Пользователь залогинен' })
	@ApiResponse({ status: 401, description: 'Неверный email или пароль' })
	login(@Body() dto: AuthDto, @Req() req: Request) {
		return this.authService.login(dto, req)
	}

	@Post('logout')
	@ApiOperation({ summary: 'Выход пользователя' })
	@ApiResponse({
		status: 200,
		type: MessageResponseDto,
		description: 'Вы успешно вышли'
	})
	@ApiResponse({ status: 401, description: 'Вы не авторизованы' })
	logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
		return this.authService.logout(req, res)
	}
}
