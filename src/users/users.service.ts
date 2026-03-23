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
import { ConfirmRegister } from 'src/utils/templates/confirmRegister.type'
import { ResetPassword } from 'src/utils/templates/resetPassword.type'
import { ConfigService } from '@nestjs/config'
import { Prisma, TokenTypes } from '@prisma/client'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { USERS_ERRORS } from './constants/users-errors'

@Injectable()
export class UsersService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly mailService: MailService,
		private readonly configService: ConfigService
	) {}

	async create(
		dto: CreateUserDto,
		prisma: Prisma.TransactionClient | PrismaService = this.prismaService
	) {
		const isFindedUser = await prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (isFindedUser) throw new BadRequestException(USERS_ERRORS.FINDED_USER)

		return await prisma.user.create({
			data: {
				email: dto.email,
				name: dto.name,
				surname: dto.surname,
				password: dto.password
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
		if (!user) throw new NotFoundException(USERS_ERRORS.NOT_FOUND_EMAIL)

		return user
	}

	async findById(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				surname: true,
				email: true,
				createdAt: true,
				updatedAt: true
			}
		})
		if (!user) throw new NotFoundException(USERS_ERRORS.NOT_FOUND)

		return user
	}
	async findByIdNoValidation(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id }
		})

		return user
	}

	async findByEmailNoValidation(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})

		return user
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

	async resetPassword({ token: tokenId, password }: ResetPasswordDto) {
		const token = await this.prismaService.token.findUnique({
			where: {
				id: tokenId
			}
		})
		if (!token || token.type !== TokenTypes.RESET_PASSWORD)
			throw new UnauthorizedException(USERS_ERRORS.INVALID_TOKEN)

		const now = new Date()
		if (now > token.expiresAt) {
			throw new BadRequestException(USERS_ERRORS.TOKEN_EXPIRED)
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
