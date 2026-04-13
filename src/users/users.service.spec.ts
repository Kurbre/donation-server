import { TestingModule, Test } from '@nestjs/testing'
import { UsersService } from './users.service'
import { ConfigService } from '@nestjs/config'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { TokenTypes } from '@prisma/client'
import { USERS_ERRORS } from './constants/users-errors'
import {
	BadRequestException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { mockUser } from '../utils/mocks/user.mock'

jest.mock('argon2', () => ({
	hash: jest.fn()
}))

import * as argon2 from 'argon2'

const mockToken: {
	id: string
	email: string
	type: TokenTypes
	createdAt: Date
	updatedAt: Date
	expiresAt: Date
} = {
	id: '123123132',
	email: mockUser.email,
	type: TokenTypes.RESET_PASSWORD,
	createdAt: new Date('2026-04-10T18:44:57.747Z'),
	updatedAt: new Date('2026-04-10T18:44:57.747Z'),
	expiresAt: new Date('2026-05-10T18:44:57.747Z')
}

const dto = {
	email: 'catiklou@gmail.com',
	name: 'Илья',
	surname: 'Змей',
	password: '123123'
}

describe('Users service', () => {
	let service: UsersService
	let prismaService: PrismaService
	let configService: ConfigService
	let mailService: MailService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: MailService,
					useValue: {
						sendMail: jest.fn(),
						getTemplate: jest.fn().mockResolvedValue('')
					}
				},
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn().mockReturnValue('http://localhost:3000')
					}
				},
				{
					provide: PrismaService,
					useValue: {
						user: {
							findUnique: jest.fn().mockResolvedValue(mockUser),
							create: jest.fn().mockResolvedValue(mockUser),
							update: jest.fn().mockResolvedValue(mockUser)
						},
						token: {
							findUnique: jest.fn().mockResolvedValue(mockToken),
							create: jest.fn().mockResolvedValue(mockToken),
							delete: jest.fn().mockResolvedValue(mockToken)
						}
					}
				}
			]
		}).compile()

		service = module.get<UsersService>(UsersService)
		prismaService = module.get<PrismaService>(PrismaService)
		configService = module.get<ConfigService>(ConfigService)
		mailService = module.get<MailService>(MailService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	it('should finded by email', async () => {
		const result = await service.findByEmail('example@gmail.com')

		expect(prismaService.user.findUnique).toHaveBeenCalledWith({
			where: {
				email: 'example@gmail.com'
			}
		})
		expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1)
		expect(result).toEqual(mockUser)
	})

	it('should not finded by email', async () => {
		;(prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

		const email = 'ex@gmail.com'

		await expect(service.findByEmail(email)).rejects.toThrow(NotFoundException)

		expect(prismaService.user.findUnique).toHaveBeenCalledWith({
			where: { email }
		})
	})

	it('should created user', async () => {
		;(prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

		const result = await service.create(dto)

		expect(result).toEqual(mockUser)
	})

	it('should not created user', async () => {
		;(prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(
			mockUser
		)

		await expect(service.create(dto)).rejects.toThrow(BadRequestException)
	})

	it('should finded user by id', async () => {
		const result = await service.findById(mockUser.id)

		await expect(prismaService.user.findUnique).toHaveBeenCalledWith({
			where: { id: mockUser.id },
			select: {
				id: true,
				name: true,
				surname: true,
				email: true,
				createdAt: true,
				updatedAt: true
			}
		})
		await expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1)

		expect(result).toEqual(mockUser)
	})

	it('should not finded user by id', async () => {
		;(prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

		await expect(service.findById(mockUser.id)).rejects.toThrow(
			NotFoundException
		)
	})

	it('should finded user by id no validation', async () => {
		const result = await service.findByIdNoValidation(mockUser.id)

		await expect(prismaService.user.findUnique).toHaveBeenCalledWith({
			where: { id: mockUser.id }
		})
		await expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1)

		expect(result).toEqual(mockUser)
	})

	it('should finded user by email no validation', async () => {
		const result = await service.findByEmailNoValidation(mockUser.email)

		await expect(prismaService.user.findUnique).toHaveBeenCalledWith({
			where: { email: mockUser.email }
		})
		await expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1)

		expect(result).toEqual(mockUser)
	})

	it('should send reset password', async () => {
		const spyFind = jest.spyOn(service, 'findByEmail')
		const spySendEmail = jest.spyOn(service, 'sendResetPasswordEmail')
		const result = await service.sendResetPassword(mockUser.email)

		expect(spyFind).toHaveBeenCalledWith(mockUser.email)
		expect(spyFind).toHaveBeenCalledTimes(1)

		expect(prismaService.token.create).toHaveBeenCalledWith({
			data: {
				email: mockUser.email,
				type: TokenTypes.RESET_PASSWORD
			}
		})

		expect(configService.getOrThrow).toHaveBeenCalledWith('CLIENT_URL')
		expect(configService.getOrThrow).toHaveBeenCalledTimes(1)

		expect(spySendEmail).toHaveBeenCalledWith(
			mockUser.email,
			expect.objectContaining({
				link: expect.stringContaining('/auth/reset?token='),
				name: mockUser.name,
				surname: mockUser.surname
			})
		)
		expect(spySendEmail).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: USERS_ERRORS.SENDING_MAIL
		})
	})

	it('should reset password', async () => {
		const spyFindTokenUnique = jest
			.spyOn(prismaService.token, 'findUnique')
			.mockResolvedValue(mockToken)
		;(argon2.hash as jest.Mock).mockResolvedValue('hashedPassword')
		const result = await service.resetPassword({
			token: mockToken.id,
			password: '123123123'
		})

		expect(spyFindTokenUnique).toHaveBeenCalledWith({
			where: { id: mockToken.id }
		})
		expect(spyFindTokenUnique).toHaveBeenCalledTimes(1)

		expect(argon2.hash).toHaveBeenCalledWith('123123123')
		expect(argon2.hash).toHaveBeenCalledTimes(1)

		expect(prismaService.user.update).toHaveBeenCalledWith({
			where: { email: mockToken.email },
			data: {
				password: 'hashedPassword'
			}
		})
		expect(prismaService.user.update).toHaveBeenCalledTimes(1)

		expect(prismaService.token.delete).toHaveBeenCalledWith({
			where: { id: mockToken.id }
		})
		expect(prismaService.token.delete).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})
	})

	it('should not token reset password', async () => {
		const spyFindTokenUnique = jest
			.spyOn(prismaService.token, 'findUnique')
			.mockResolvedValue(null)
		await expect(
			service.resetPassword({
				token: mockToken.id,
				password: '123123123'
			})
		).rejects.toThrow(UnauthorizedException)

		expect(spyFindTokenUnique).toHaveBeenCalledWith({
			where: { id: mockToken.id }
		})
		expect(spyFindTokenUnique).toHaveBeenCalledTimes(1)
	})

	it('should not token type reset password', async () => {
		const invalidToken = {
			...mockToken,
			type: TokenTypes.CHANGE_PASSWORD
		}

		const spyFindTokenUnique = jest
			.spyOn(prismaService.token, 'findUnique')
			.mockResolvedValue(invalidToken)
		await expect(
			service.resetPassword({
				token: invalidToken.id,
				password: '123123123'
			})
		).rejects.toThrow(UnauthorizedException)

		expect(spyFindTokenUnique).toHaveBeenCalledWith({
			where: { id: invalidToken.id }
		})
		expect(spyFindTokenUnique).toHaveBeenCalledTimes(1)
	})

	it('should not token type and not token reset password', async () => {
		const invalidToken = {
			...mockToken,
			type: TokenTypes.CHANGE_PASSWORD
		}

		const spyFindTokenUnique = jest
			.spyOn(prismaService.token, 'findUnique')
			.mockResolvedValue(null)
		await expect(
			service.resetPassword({
				token: invalidToken.id,
				password: '123123123'
			})
		).rejects.toThrow(UnauthorizedException)

		expect(spyFindTokenUnique).toHaveBeenCalledWith({
			where: { id: invalidToken.id }
		})
		expect(spyFindTokenUnique).toHaveBeenCalledTimes(1)
	})

	it('should not expiresin type reset password', async () => {
		const invalidToken = {
			...mockToken,
			expiresAt: new Date('2026-04-10T18:44:57.747Z')
		}

		const spyFindTokenUnique = jest
			.spyOn(prismaService.token, 'findUnique')
			.mockResolvedValue(invalidToken)
		await expect(
			service.resetPassword({
				token: invalidToken.id,
				password: '123123123'
			})
		).rejects.toThrow(BadRequestException)

		expect(spyFindTokenUnique).toHaveBeenCalledWith({
			where: { id: invalidToken.id }
		})
		expect(spyFindTokenUnique).toHaveBeenCalledTimes(1)
	})

	it('should send reset password', async () => {
		const data = {
			link: '',
			name: '',
			surname: '',
			techLink: '',
			title: ''
		}

		const spyGetTemplate = jest
			.spyOn(mailService, 'getTemplate')
			.mockResolvedValue('html')
		const spySendMail = jest
			.spyOn(mailService, 'sendMail')
			.mockResolvedValue('html')

		await service.sendResetPasswordEmail(mockUser.email, data)

		expect(spyGetTemplate).toHaveBeenCalledWith('resetPassword', data)
		expect(spyGetTemplate).toHaveBeenCalledTimes(1)

		expect(spySendMail).toHaveBeenCalledWith(
			mockUser.email,
			'Сброс пароля',
			'html'
		)
		expect(spySendMail).toHaveBeenCalledTimes(1)
	})

	it('should change password', async () => {
		;(argon2.hash as jest.Mock).mockResolvedValue('hashedPassword')
		const spyFindById = jest
			.spyOn(service, 'findById')
			.mockResolvedValue(mockUser)

		const result = await service.changePassword(mockUser.id, 'newPassword')

		expect(spyFindById).toHaveBeenCalledWith(mockUser.id)
		expect(spyFindById).toHaveBeenCalledTimes(1)

		expect(argon2.hash).toHaveBeenCalledWith('newPassword')
		expect(argon2.hash).toHaveBeenCalledTimes(1)

		expect(prismaService.user.update).toHaveBeenCalledWith({
			where: {
				id: mockUser.id
			},
			data: {
				password: 'hashedPassword'
			}
		})

		expect(result).toEqual({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})
	})

	it('should not finded change password', async () => {
		;(argon2.hash as jest.Mock).mockResolvedValue('hashedPassword')
		const spyFindById = jest
			.spyOn(service, 'findById')
			.mockRejectedValue(new NotFoundException())

		await expect(
			service.changePassword(mockUser.id, 'newPassword')
		).rejects.toThrow(NotFoundException)

		expect(spyFindById).toHaveBeenCalledWith(mockUser.id)
		expect(spyFindById).toHaveBeenCalledTimes(1)

		expect(prismaService.user.update).not.toHaveBeenCalled()
	})

	// Find token for reset password
	it('Should find token for reset password', async () => {
		const result = await service.findResetPasswordToken(mockToken.id)

		expect(prismaService.token.findUnique).toHaveBeenCalledWith({
			where: { id: mockToken.id }
		})
		expect(prismaService.token.findUnique).toHaveBeenCalledTimes(1)

		expect(result).toBe(true)
	})

	it('Should find token for reset password if not valid token', async () => {
		jest.spyOn(prismaService.token, 'findUnique').mockResolvedValue(null)

		await expect(service.findResetPasswordToken(mockToken.id)).rejects.toThrow(
			NotFoundException
		)

		expect(prismaService.token.findUnique).toHaveBeenCalledWith({
			where: { id: mockToken.id }
		})
		expect(prismaService.token.findUnique).toHaveBeenCalledTimes(1)
	})
})
