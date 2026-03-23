import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { hash, verify } from 'argon2'
import { Response, type Request } from 'express'
import { MailService } from 'src/mail/mail.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { UsersService } from 'src/users/users.service'
import { ConfirmRegister } from 'src/utils/templates/confirmRegister.type'
import { AUTH_ERRORS } from './constants/auth-errors'
import { AuthDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)

	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly mailService: MailService,
		private readonly prismaService: PrismaService
	) {}

	async register(dto: CreateUserDto) {
		const data = {
			message: 'Если email не зарегестрирован, письмо отправлено'
		}

		const user = await this.usersService.findByEmailNoValidation(dto.email)
		if (user) return data

		const hashPassword = await hash(dto.password)

		await this.prismaService.pendingUser.deleteMany({
			where: { email: dto.email }
		})

		const pendingUser = await this.prismaService.pendingUser.create({
			data: {
				email: dto.email,
				name: dto.name,
				surname: dto.surname,
				password: hashPassword
			}
		})

		this.sendConfirmEmail(dto.email, {
			name: dto.name,
			surname: dto.surname,
			link: `${this.configService.getOrThrow('CLIENT_URL')}/auth/confirm?token=${pendingUser.token}`,
			title: 'Подтверждение регистрации'
		}).catch(err => this.logger.debug(err))

		return data
	}

	async confirmedRegister(token: string, req: Request) {
		const user = await this.prismaService.$transaction(async tx => {
			const pendingUser = await tx.pendingUser.findUnique({
				where: {
					token
				}
			})
			if (!pendingUser)
				throw new UnauthorizedException(AUTH_ERRORS.INVALID_TOKEN)

			const now = new Date()
			if (now > pendingUser.expiresAt) {
				throw new BadRequestException(AUTH_ERRORS.TOKEN_EXPIRED)
			}

			const user = await this.usersService.create(
				{
					email: pendingUser.email,
					name: pendingUser.name,
					surname: pendingUser.surname,
					password: pendingUser.password
				},
				tx
			)

			await tx.pendingUser.delete({
				where: { id: pendingUser.id }
			})

			return user
		})

		await this.saveSession(req, user)

		return user
	}

	async login(dto: AuthDto, req: Request) {
		const userData = await this.usersService.findByEmail(dto.email)

		const isValidPassword = await verify(userData.password, dto.password)
		if (!isValidPassword)
			throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS)

		await this.saveSession(req, userData)

		const { password, ...user } = userData

		return user
	}

	async logout(req: Request, res: Response): Promise<{ message: string }> {
		if (!req.session.token)
			throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED_LOGOUT)

		await new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err)
					return reject(
						new InternalServerErrorException(AUTH_ERRORS.BAD_LOGOUT)
					)
				resolve(true)
			})
		})

		res.clearCookie(this.configService.getOrThrow<string>('COOKIE_NAME'))
		return {
			message: 'Вы успешно вышли из аккаунта.'
		}
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
		return this.jwtService.signAsync(
			{
				sub: user.id,
				email: user.email
			},
			{
				expiresIn: '7d'
			}
		)
	}

	private async saveSession(req: Request, user: Omit<User, 'password'>) {
		const token = await this.generateJwtToken(user)

		return new Promise<void>((resolve, reject) => {
			req.session.token = token

			req.session.save(err => {
				if (err) {
					return reject(new InternalServerErrorException(AUTH_ERRORS.SESSION))
				}

				resolve()
			})
		})
	}
}
