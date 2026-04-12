import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { MailService } from '../mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { mockUser } from '../utils/mocks/user.mock'
import { AuthService } from './auth.service'
import { CreateUserDto } from 'src/users/dto/create-user.dto'
import { AUTH_ERRORS } from './constants/auth-errors'
jest.mock('argon2', () => ({
	hash: jest.fn(),
	verify: jest.fn()
}))
import * as argon2 from 'argon2'
import { verify } from 'crypto'
import { Request } from 'express'

const pendingUser = {
	token: 'token',
	id: '123123',
	name: 'name',
	surname: 'surname',
	email: 'example@gmail.com',
	password: '123',
	createdAt: new Date('2026-04-10T18:44:57.747Z'),
	updatedAt: new Date('2026-04-10T18:44:57.747Z'),
	expiresAt: new Date('2026-05-10T18:44:57.747Z')
}

describe('Auth service', () => {
	let service: AuthService
	let usersService: UsersService
	let prismaService: PrismaService
	let jwtService: JwtService
	let configService: ConfigService
	let mailService: MailService
	let mockTx: {
		pendingUser: {
			findUnique: jest.Mock
			delete: jest.Mock
		}
	}
	let mockRequest
	let mockResponse

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: PrismaService,
					useValue: {
						pendingUser: {
							deleteMany: jest.fn().mockResolvedValue(undefined),
							create: jest.fn().mockResolvedValue(pendingUser)
						},
						$transaction: jest.fn(cb => cb(mockTx))
					}
				},
				{
					provide: UsersService,
					useValue: {
						findByEmailNoValidation: jest.fn().mockResolvedValue(mockUser),
						findByEmail: jest.fn().mockResolvedValue(mockUser),
						create: jest.fn().mockResolvedValue(mockUser)
					}
				},
				{
					provide: JwtService,
					useValue: {
						signAsync: jest.fn().mockResolvedValue('token')
					}
				},
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn()
					}
				},
				{
					provide: MailService,
					useValue: {
						getTemplate: jest.fn().mockResolvedValue(''),
						sendMail: jest.fn()
					}
				}
			]
		}).compile()

		service = module.get<AuthService>(AuthService)
		usersService = module.get<UsersService>(UsersService)
		prismaService = module.get<PrismaService>(PrismaService)
		jwtService = module.get<JwtService>(JwtService)
		configService = module.get<ConfigService>(ConfigService)
		mailService = module.get<MailService>(MailService)
		mockTx = {
			pendingUser: {
				findUnique: jest.fn(),
				delete: jest.fn()
			}
		}
		mockRequest = {
			session: {
				token: 'token',
				save: jest.fn(callback => callback(null)),
				destroy: jest.fn(callback => callback(null))
			}
		}
		mockResponse = {
			clearCookie: jest.fn()
		}
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	// Confirmed register
	it('should confirmed register', async () => {
		mockTx.pendingUser.findUnique.mockResolvedValue(pendingUser)
		mockTx.pendingUser.delete.mockResolvedValue(undefined)
		;(usersService.create as jest.Mock).mockResolvedValue(mockUser)

		const result = await service.confirmedRegister('token', mockRequest)

		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledWith({
			where: {
				token: 'token'
			}
		})
		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledTimes(1)

		expect(usersService.create).toHaveBeenCalledTimes(1)

		expect(mockTx.pendingUser.delete).toHaveBeenCalledWith({
			where: { id: pendingUser.id }
		})
		expect(mockTx.pendingUser.delete).toHaveBeenCalledTimes(1)

		expect(jwtService.signAsync).toHaveBeenCalled()
		expect(mockRequest.session.token).toBeDefined()
		expect(mockRequest.session.save).toHaveBeenCalled()

		expect(result).toEqual(mockUser)
	})

	it('should confirmed register if not find pending user', async () => {
		mockTx.pendingUser.findUnique.mockResolvedValue(null)

		await expect(
			service.confirmedRegister('token', mockRequest)
		).rejects.toThrow(UnauthorizedException)

		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledWith({
			where: {
				token: 'token'
			}
		})
		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledTimes(1)
	})

	it('should confirmed register if expires it token', async () => {
		const mockPendingUser = {
			...pendingUser,
			expiresAt: new Date('2026-03-10T18:44:57.747Z')
		}

		mockTx.pendingUser.findUnique.mockResolvedValue(mockPendingUser)

		await expect(
			service.confirmedRegister('token', mockRequest)
		).rejects.toThrow(BadRequestException)

		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledWith({
			where: {
				token: 'token'
			}
		})
		expect(mockTx.pendingUser.findUnique).toHaveBeenCalledTimes(1)
	})

	// Register
	it('should register', async () => {
		const dto: CreateUserDto = {
			email: mockUser.email,
			name: mockUser.name,
			surname: mockUser.surname,
			password: '123123'
		}
		;(usersService.findByEmailNoValidation as jest.Mock).mockResolvedValue(null)
		;(argon2.hash as jest.Mock).mockResolvedValue('hashPassword')
		;(prismaService.pendingUser.create as jest.Mock).mockResolvedValue({
			token: 'mockToken',
			id: 'mockId'
		})
		const result = await service.register(dto)

		expect(usersService.findByEmailNoValidation).toHaveBeenCalledWith(dto.email)
		expect(usersService.findByEmailNoValidation).toHaveBeenCalledTimes(1)

		expect(prismaService.pendingUser.deleteMany).toHaveBeenCalledWith({
			where: { email: dto.email }
		})
		expect(prismaService.pendingUser.deleteMany).toHaveBeenCalledTimes(1)

		expect(prismaService.pendingUser.create).toHaveBeenCalledWith({
			data: {
				email: dto.email,
				name: dto.name,
				surname: dto.surname,
				password: 'hashPassword'
			}
		})
		expect(prismaService.pendingUser.create).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: AUTH_ERRORS.SUCCESS_SEND_REGISTER_MAIL
		})
	})

	// Login
	it('should login', async () => {
		;(argon2.verify as jest.Mock).mockResolvedValue(true)
		;(usersService.findByEmail as jest.Mock).mockResolvedValue({
			...mockUser,
			password: 'password'
		})

		const result = await service.login(
			{
				email: mockUser.email,
				password: 'password'
			},
			mockRequest
		)

		expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email)
		expect(usersService.findByEmail).toHaveBeenCalledTimes(1)

		expect(argon2.verify).toHaveBeenCalledWith('password', 'password')
		expect(argon2.verify).toHaveBeenCalledTimes(1)

		expect(jwtService.signAsync).toHaveBeenCalled()
		expect(mockRequest.session.token).toBeDefined()
		expect(mockRequest.session.save).toHaveBeenCalled()

		expect(result).toEqual(mockUser)
	})

	it('should login if not currect password', async () => {
		;(argon2.verify as jest.Mock).mockResolvedValue(false)
		;(usersService.findByEmail as jest.Mock).mockResolvedValue({
			...mockUser,
			password: 'password'
		})

		await expect(
			service.login(
				{
					email: mockUser.email,
					password: '123123'
				},
				mockRequest
			)
		).rejects.toThrow(UnauthorizedException)

		expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email)
		expect(usersService.findByEmail).toHaveBeenCalledTimes(1)

		expect(argon2.verify).toHaveBeenCalledWith('password', '123123')
		expect(argon2.verify).toHaveBeenCalledTimes(1)
	})

	it('should logout', async () => {
		const result = await service.logout(mockRequest, mockResponse)

		expect(mockRequest.session.destroy).toHaveBeenCalled()
		expect(mockResponse.clearCookie).toHaveBeenCalled()

		expect(result).toEqual({
			message: 'Вы успешно вышли из аккаунта.'
		})
	})

	it("should logout if don't logout", async () => {
		const req = { session: {} } as Request

		await expect(service.logout(req, mockResponse)).rejects.toThrow(
			UnauthorizedException
		)

		expect(mockRequest.session.destroy).not.toHaveBeenCalled()
		expect(mockResponse.clearCookie).not.toHaveBeenCalled()
	})
})
