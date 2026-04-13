import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { SendResetPasswordDto } from './dto/send-reset-password.dto'
import { USERS_ERRORS } from './constants/users-errors'
import { JwtService } from '@nestjs/jwt'
import {
	BadRequestException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { mockUser } from '../utils/mocks/user.mock'

describe('Users controller', () => {
	let controller: UsersController
	let service: UsersService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: {
						sendResetPassword: jest.fn(),
						resetPassword: jest.fn(),
						changePassword: jest.fn(),
						findById: jest.fn(),
						findResetPasswordToken: jest.fn().mockResolvedValue(true)
					}
				},
				{
					provide: JwtService,
					useValue: { verifyAsync: jest.fn() }
				}
			]
		}).compile()

		controller = module.get<UsersController>(UsersController)
		service = module.get<UsersService>(UsersService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	// Send reset password
	it('should send reset password', async () => {
		const dto: SendResetPasswordDto = {
			email: 'example@gmail.com'
		}
		;(service.sendResetPassword as jest.Mock).mockResolvedValue({
			message: USERS_ERRORS.SENDING_MAIL
		})

		const result = await controller.sendResetPassword(dto)

		expect(service.sendResetPassword).toHaveBeenCalledWith(dto.email)
		expect(service.sendResetPassword).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: USERS_ERRORS.SENDING_MAIL
		})
	})

	it('should send reset password, not find user by email', async () => {
		const dto: SendResetPasswordDto = {
			email: 'example@gmail.com'
		}
		;(service.sendResetPassword as jest.Mock).mockRejectedValue(
			new NotFoundException()
		)

		await expect(controller.sendResetPassword(dto)).rejects.toThrow(
			NotFoundException
		)

		expect(service.sendResetPassword).toHaveBeenCalledWith(dto.email)
		expect(service.sendResetPassword).toHaveBeenCalledTimes(1)
	})

	// Reset password
	it('should reset password', async () => {
		const dto: ResetPasswordDto = {
			token: 'token',
			password: 'newPassword'
		}
		;(service.resetPassword as jest.Mock).mockResolvedValue({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})

		const result = await controller.resetPassword(dto)

		expect(service.resetPassword).toHaveBeenCalledWith(dto)
		expect(service.resetPassword).toHaveBeenCalledTimes(1)

		expect(result).toEqual({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})
	})

	it('should reset password, expired token', async () => {
		const dto: ResetPasswordDto = {
			token: 'token',
			password: 'newPassword'
		}
		;(service.resetPassword as jest.Mock).mockRejectedValue(
			new BadRequestException()
		)

		await expect(controller.resetPassword(dto)).rejects.toThrow(
			BadRequestException
		)

		expect(service.resetPassword).toHaveBeenCalledWith(dto)
		expect(service.resetPassword).toHaveBeenCalledTimes(1)
	})

	it('should reset password, not valid token type', async () => {
		const dto: ResetPasswordDto = {
			token: 'token',
			password: 'newPassword'
		}
		;(service.resetPassword as jest.Mock).mockRejectedValue(
			new UnauthorizedException()
		)

		await expect(controller.resetPassword(dto)).rejects.toThrow(
			UnauthorizedException
		)

		expect(service.resetPassword).toHaveBeenCalledWith(dto)
		expect(service.resetPassword).toHaveBeenCalledTimes(1)
	})

	// Change password
	it('should change password', async () => {
		const dto: ChangePasswordDto = {
			password: 'newPassword'
		}

		;(service.changePassword as jest.Mock).mockResolvedValue({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})

		const result = await service.changePassword(mockUser.id, dto.password)

		expect(result).toEqual({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})
	})

	// Profile
	it('should profile', async () => {
		;(service.findById as jest.Mock).mockResolvedValue(mockUser)

		const result = await service.findById(mockUser.id)

		expect(result).toEqual(mockUser)
	})

	it("should profile, don't find user", async () => {
		;(service.findById as jest.Mock).mockRejectedValue(new NotFoundException())

		await expect(service.findById).rejects.toThrow(NotFoundException)
	})

	// Get reset password token
	it('should find reset password by id', async () => {
		const result = await service.findResetPasswordToken('123123')

		expect(result).toBe(true)
	})

	it('should find reset password by id if not valid token', async () => {
		jest
			.spyOn(service, 'findResetPasswordToken')
			.mockRejectedValue(new NotFoundException())

		await expect(service.findResetPasswordToken('123123')).rejects.toThrow(
			NotFoundException
		)
	})
})
