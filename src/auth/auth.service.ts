import { type Request, Response } from 'express'
import { UsersService } from '../users/users.service'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { JwtService } from '@nestjs/jwt'
import {
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from '@nestjs/common'
import { LoginDto } from './dto/login.dto'
import { verify } from 'argon2'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService
	) {}

	async login({ password, login }: LoginDto, req: Request) {
		const user = await this.usersService.findUserSelectedPassword(login)

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword) {
			throw new UnauthorizedException('Логин или пароль не верные')
		}

		const token = await this.generateJwtToken(user.id)
		await this.saveSession(req, token)

		return await this.usersService.findUser(login)
	}

	async register(dto: CreateUserDto, req: Request) {
		// create returns a mongoose document that includes the hashed password.
		const user = await this.usersService.create(dto)

		const token = await this.generateJwtToken(user.id)
		await this.saveSession(req, token)

		// strip password before sending data back to caller
		// `toObject` is safe because the returned value is a hydrated document
		const result = user.toObject ? user.toObject() : { ...user }
		if ('password' in result) {
			delete result.password
		}
		return result
	}

	logout(req: Request, res: Response): Promise<{ message: string }> {
		return new Promise((resolve, reject) => {
			if (!req.session.token)
				return reject(
					new UnauthorizedException(
						'Вы не авторизованы, чтобы выйти из аккаунта.'
					)
				)

			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException('Не удалось выйти из аккаунта.')
					)
				}

				res.clearCookie(this.configService.getOrThrow<string>('COOKIE_NAME'))

				resolve({
					message: 'Вы вышли из аккаунта.'
				})
			})
		})
	}

	private async generateJwtToken(id: string) {
		return await this.jwtService.signAsync({ id })
	}

	private saveSession(req: Request, token: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!req.session) {
				return reject(
					new InternalServerErrorException('Сессия не инициализирована')
				)
			}

			req.session.token = token

			req.session.save(err => {
				if (err)
					return reject(
						new InternalServerErrorException('Не удалось сохранить сессию')
					)

				resolve(token)
			})
		})
	}
}
