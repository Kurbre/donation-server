import { Test, TestingModule } from '@nestjs/testing'
import { CreateUserDto } from '../users/dto/create-user.dto'
import { mockUser } from '../utils/mocks/user.mock'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AUTH_ERRORS } from './constants/auth-errors'
import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { AuthDto } from './dto/auth.dto'

describe('Auth controller', () => {
	let service: AuthService
	let controller: AuthController
	let mockRequest
	let mockResponse

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: {
						register: jest.fn(),
						confirmedRegister: jest.fn(),
						login: jest.fn(),
						logout: jest.fn()
					}
				}
			]
		}).compile()

		service = module.get<AuthService>(AuthService)
		controller = module.get<AuthController>(AuthController)
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

	it('should be defined', () => {
		expect(service).toBeDefined()
		expect(controller).toBeDefined()
	})

	// Register
	it('should register', async () => {
		jest.spyOn(service, 'register').mockResolvedValue({
			message: AUTH_ERRORS.SUCCESS_SEND_REGISTER_MAIL
		})

		const dto: CreateUserDto = {
			email: mockUser.email,
			name: mockUser.name,
			password: 'password',
			surname: mockUser.surname
		}

		const result = await service.register(dto)

		expect(service.register).toHaveBeenCalledWith(dto)
		expect(service.register).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: AUTH_ERRORS.SUCCESS_SEND_REGISTER_MAIL
		})
	})

	// Confirmed register
	it('should confirmed register', async () => {
		jest.spyOn(service, 'confirmedRegister').mockResolvedValue(mockUser)

		const result = await service.confirmedRegister('token', mockRequest)

		expect(service.confirmedRegister).toHaveBeenCalledWith('token', mockRequest)
		expect(service.confirmedRegister).toHaveBeenCalledTimes(1)

		expect(result).toEqual(mockUser)
	})

	it('should confirmed register if exires in token', async () => {
		jest
			.spyOn(service, 'confirmedRegister')
			.mockRejectedValue(new BadRequestException())

		await expect(
			service.confirmedRegister('token', mockRequest)
		).rejects.toThrow(BadRequestException)

		expect(service.confirmedRegister).toHaveBeenCalledWith('token', mockRequest)
		expect(service.confirmedRegister).toHaveBeenCalledTimes(1)
	})

	it('should confirmed register if not valid token', async () => {
		jest
			.spyOn(service, 'confirmedRegister')
			.mockRejectedValue(new UnauthorizedException())

		await expect(
			service.confirmedRegister('token', mockRequest)
		).rejects.toThrow(UnauthorizedException)

		expect(service.confirmedRegister).toHaveBeenCalledWith('token', mockRequest)
		expect(service.confirmedRegister).toHaveBeenCalledTimes(1)
	})

	// Login
	it('should login', async () => {
		jest.spyOn(service, 'login').mockResolvedValue(mockUser)

		const dto: AuthDto = {
			email: mockUser.email,
			password: 'password'
		}

		const result = await service.login(dto, mockRequest)

		expect(service.login).toHaveBeenCalledWith(dto, mockRequest)
		expect(service.login).toHaveBeenCalledTimes(1)

		expect(result).toEqual(mockUser)
	})

	it('should login if not valid password', async () => {
		jest.spyOn(service, 'login').mockRejectedValue(new UnauthorizedException())

		const dto: AuthDto = {
			email: mockUser.email,
			password: 'password'
		}

		await expect(service.login(dto, mockRequest)).rejects.toThrow(
			UnauthorizedException
		)

		expect(service.login).toHaveBeenCalledWith(dto, mockRequest)
		expect(service.login).toHaveBeenCalledTimes(1)
	})

	it('should login if not finded user', async () => {
		jest.spyOn(service, 'login').mockRejectedValue(new NotFoundException())

		const dto: AuthDto = {
			email: mockUser.email,
			password: 'password'
		}

		await expect(service.login(dto, mockRequest)).rejects.toThrow(
			NotFoundException
		)

		expect(service.login).toHaveBeenCalledWith(dto, mockRequest)
		expect(service.login).toHaveBeenCalledTimes(1)
	})

	// Logout
	it('should logout', async () => {
		const data = {
			message: 'Вы успешно вышли из аккаунта.'
		}

		jest.spyOn(service, 'logout').mockResolvedValue(data)

		const result = await service.logout(mockRequest, mockResponse)

		expect(service.logout).toHaveBeenCalledWith(mockRequest, mockResponse)
		expect(service.logout).toHaveBeenCalledTimes(1)

		expect(result).toEqual(data)
	})

	it('should logout if auth', async () => {
		jest
			.spyOn(service, 'logout')
			.mockRejectedValue(new InternalServerErrorException())

		await expect(service.logout(mockRequest, mockResponse)).rejects.toThrow(
			InternalServerErrorException
		)

		expect(service.logout).toHaveBeenCalledWith(mockRequest, mockResponse)
		expect(service.logout).toHaveBeenCalledTimes(1)
	})
})
