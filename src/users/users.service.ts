import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { hash } from 'argon2'
import { MailService } from 'src/mail/mail.service'
import { ConfirmRegister } from 'src/utils/templates/configRegister.type'
import { ResetPassword } from 'src/utils/templates/resetPassword.type'
import { ConfigService } from '@nestjs/config'
import { TokenTypes } from '@prisma/client'

@Injectable()
export class UsersService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly configService: ConfigService
	) {}

	async create(dto: CreateUserDto) {
		const isFindedUser = await this.prismaService.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (isFindedUser)
			throw new BadRequestException(
				'Пользователь с таким email уже зарегестрирован'
			)

		const hashPassword = await hash(dto.password)

		return await this.prismaService.user.create({
			data: {
				...dto,
				password: hashPassword
			},
			select: {
				id: true,
				name: true,
				surname: true,
				email: true,
				createdAt: true,
				updatedAt: true
			}
		})
	}

	async findByEmail(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: { email }
		})
		if (!user)
			throw new NotFoundException('Пользователь с таким Email не найден')

		return user
	}

	async findById(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id }
		})
		if (!user) throw new NotFoundException('Пользователь не найден')

		return user
	}
	async findByIdNoValidation(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id }
		})

		return user
	}

	async isNotHasUser(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})
		if (user)
			throw new BadRequestException(
				'Пользователь с таким email уже зарегестрирован'
			)
	}

	async sendResetPassword(email: string) {
		const user = await this.findByEmail(email)

		const token = await this.prismaService.token.create({
			data: {
				email,
				type: TokenTypes.RESET_PASSWORD
			}
		})

		const clientUrl = this.configService.getOrThrow<string>('CLIENT_URL')

		await this.sendResetPasswordEmail(email, {
			link: `${clientUrl}/auth/reset?token=${token.id}`,
			name: user.name,
			surname: user.surname,
			title: 'Сброс пароля',
			techLink: `${clientUrl}`
		})

		return {
			message: 'Письмо отправлено'
		}
	}

	async resetPassword(tokenId: string, password: string) {
		const token = await this.prismaService.token.findUnique({
			where: {
				id: tokenId
			}
		})
		if (!token || token.type !== TokenTypes.RESET_PASSWORD)
			throw new UnauthorizedException('Токен не валидный')

		const now = new Date()
		if (now > token.expiresAt) {
			throw new BadRequestException('Токен просрочен')
		}

		const newPassword = await hash(password)

		await this.prismaService.user.update({
			where: { email: token.email },
			data: {
				password: newPassword
			}
		})

		await this.prismaService.token.delete({
			where: { id: token.id }
		})

		return {
			message: 'Пароль успешно изменен на новый'
		}
	}

	async sendResetPasswordEmail(to: string, data: ResetPassword) {
		const template = await this.mailService.getTemplate('resetPassword', data)

		await this.mailService.sendMail(to, 'Сброс пароля', template)
	}

	async changePassword(userId: string, password: string) {
		await this.findById(userId)

		const newPassword = await hash(password)

		await this.prismaService.user.update({
			where: {
				id: userId
			},
			data: {
				password: newPassword
			}
		})

		return {
			message: 'Пароль успешно изменен'
		}
	}
}
