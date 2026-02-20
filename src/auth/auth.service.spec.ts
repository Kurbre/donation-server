import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { v4 as uuidv4 } from 'uuid'
import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { verify } from 'argon2'
import {
	BadRequestException,
	InternalServerErrorException
} from '@nestjs/common'

jest.mock('argon2')

// user object returned by queries (password stripped)
const user = {
	_id: uuidv4(),
	login: 'dfgdfgdfggdf',
	email: 'gdfdfg@gmail.com',
	phoneNumber: '+380951267890',
	createdAt: '2026-02-12T18:40:48.402Z',
	updatedAt: '2026-02-12T18:40:48.402Z',
	__v: 0
}

// same user including hashed password, used when selecting password explicitly
const userWithPassword = {
	...user,
	password: '$argon2id$v=19$m=19456,t=2,p=1$hashedpassword'
}

const dto: LoginDto = {
	login: user.email,
	password: 'test123'
}

describe('Auth service', () => {
	let service: AuthService
	let usersService: UsersService
	let jwtService: JwtService
	let configService: ConfigService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UsersService,
					useValue: {
						create: jest.fn().mockResolvedValue(user),
						findUserSelectedPassword: jest.fn().mockResolvedValue(user),
						findUser: jest.fn().mockResolvedValue(user),
						findById: jest.fn().mockResolvedValue(user),
						findByIdNoValidation: jest.fn().mockResolvedValue(user)
					}
				},
				{
					provide: JwtService,
					useValue: {
						signAsync: jest.fn().mockResolvedValue('mock-token')
					}
				},
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn().mockResolvedValue(''),
						get: jest.fn().mockResolvedValue('')
					}
				}
			]
		}).compile()

		service = module.get<AuthService>(AuthService)
		usersService = module.get<UsersService>(UsersService)
		jwtService = module.get<JwtService>(JwtService)
		;(verify as jest.Mock).mockResolvedValue(true)
		configService = module.get<ConfigService>(ConfigService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	it('should generated jwt token', async () => {
		const token = await jwtService.signAsync(user._id)
		expect(token).toEqual('mock-token')
	})

	it('should successfully login', async () => {
		const req = {
			session: {
				save: jest.fn(callback => callback(null))
			}
		} as unknown as Request
		const result = await service.login(dto, req)

		expect(result).toEqual(user)
	})

	it('should successfully register', async () => {
		const req = {
			session: {
				save: jest.fn(callback => callback(null))
			}
		} as unknown as Request
		const result = await service.register(
			{
				...dto,
				email: user.email,
				phoneNumber: user.phoneNumber
			},
			req
		)

		// password should be removed by the service
		expect(result).toEqual(user)
		expect((result as any).password).toBeUndefined()
			message: 'Вы вышли из аккаунта.'
		})
	})

	// Errors
	it('should throw UnauthorizedException when password is invalid', async () => {
		;(verify as jest.Mock).mockResolvedValue(false)

		const req = {
			session: {
				save: jest.fn(callback => callback(null))
			}
		} as unknown as Request

		await expect(service.login(dto, req)).rejects.toThrow(
			'Логин или пароль не верные'
		)
	})

	it('should throw error when user not found', async () => {
		jest
			.spyOn(usersService, 'findUserSelectedPassword')
			.mockRejectedValue(new Error('User not found'))

		const req = {
			session: {
				save: jest.fn(callback => callback(null))
			}
		} as unknown as Request

		await expect(service.login(dto, req)).rejects.toThrow('User not found')
	})

	it('should throw InternalServerErrorException when session save fails', async () => {
		const req = {
			session: {
				save: jest.fn(callback =>
					callback(
						new InternalServerErrorException('Не удалось сохранить сессию')
					)
				)
			}
		} as unknown as Request

		await expect(service.login(dto, req)).rejects.toThrow(
			'Не удалось сохранить сессию'
		)
	})

	it('should throw BadRequestException when register is invalid', async () => {
		jest
			.spyOn(usersService, 'create')
			.mockRejectedValue(
				new BadRequestException('Пользователь с такими данными уже существует')
			)

		const req = {
			session: {
				save: jest.fn(callback => callback(null))
			}
		} as unknown as Request

		await expect(
			service.register(
				{
					...dto,
					email: user.email,
					phoneNumber: user.phoneNumber
				},
				req
			)
		).rejects.toThrow('Пользователь с такими данными уже существует')
	})
})
