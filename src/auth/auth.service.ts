import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { Response, type Request } from 'express'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { UsersService } from 'src/users/users.service'
import { AuthDto } from './dto/auth.dto'
import { verify } from 'argon2'
import { ConfigService } from '@nestjs/config'
import { MailService } from 'src/mail/mail.service'
import { ConfirmRegister } from 'src/utils/templates/configRegister.type'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly mailService: MailService,
		private readonly prismaService: PrismaService
	) {}

	async register(dto: CreateUserDto) {
		await this.usersService.isNotHasUser(dto.email)

		const pendingUser = await this.prismaService.pendingUser.create({
			data: {
				...dto
			}
		})

		await this.sendConfirmEmail(dto.email, {
			name: dto.name,
			surname: dto.surname,
			link: `${this.configService.getOrThrow('CLIENT_URL')}/auth/confirm?token=${pendingUser.token}`,
			title: 'Подтверждение регистрации'
		})

		return {
			message: 'Письмо отправлено'
		}
	}

	async confirmedRegister(token: string, req: Request) {
		const pendingUser = await this.prismaService.pendingUser.findUnique({
			where: {
				token
			}
		})
		if (!pendingUser) throw new UnauthorizedException('Токен не валидный')

		const now = new Date()
		if (now > pendingUser.expiresAt) {
			throw new BadRequestException('Токен просрочен')
		}

		const user = await this.usersService.create({
			email: pendingUser.email,
			name: pendingUser.name,
			surname: pendingUser.surname,
			password: pendingUser.password
		})

		await this.saveSession(req, user)

		await this.prismaService.pendingUser.delete({
			where: { id: pendingUser.id }
		})

		return user
	}

	async login(dto: AuthDto, req: Request) {
		const { password, ...user } = await this.usersService.findByEmail(dto.email)

		const isValidPassword = await verify(password, dto.password)
		if (!isValidPassword)
			throw new UnauthorizedException('Email или пароль не правильные')

		await this.saveSession(req, user)

		return user
	}

	async logout(req: Request, res: Response): Promise<{ message: string }> {
		return new Promise((resolve, reject) => {
			if (!req.session.token)
				return reject(
					new UnauthorizedException(
						'Вы не авторизованы, чтобы выйти из аккаунта.'
					)
				)

			req.session.destroy(err => {
				if (err)
					return reject(
						new InternalServerErrorException('Не удалось выйти из аккаунта.')
					)

				res.clearCookie(this.configService.getOrThrow<string>('COOKIE_NAME'))
				resolve({
					message: 'Вы успешно вышли из аккаунта.'
				})
			})
		})
	}

	private async sendConfirmEmail(to: string, data: ConfirmRegister) {
		const template = await this.mailService.getTemplate<ConfirmRegister>(
			'confirmRegister',
			{
				...data
			}
		)

		await this.mailService.sendMail(to, 'Подтверждение email', template)
	}

	private async generateJwtToken(user: Omit<User, 'password'>) {
		return this.jwtService.signAsync({
			sub: user.id,
			email: user.email
		})
	}

	private async saveSession(req: Request, user: Omit<User, 'password'>) {
		const token = await this.generateJwtToken(user)

		return new Promise((resolve, reject) => {
			req.session.token = token

			req.session.save(err => {
				if (err) {
					console.log(err)

					return reject(
						new InternalServerErrorException(
							'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сесси.'
						)
					)
				}

				resolve(user)
			})
		})
	}
}
