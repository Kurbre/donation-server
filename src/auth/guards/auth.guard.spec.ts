import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'src/users/users.service'
import { mockUser } from '../../utils/mocks/user.mock'
import { AuthGuard } from './auth.guard'

describe('Auth guard', () => {
	let guard: AuthGuard
	let jwtService: JwtService
	let usersService: UsersService

	beforeEach(() => {
		jwtService = {
			verifyAsync: jest.fn()
		} as any

		usersService = {
			findByIdNoValidation: jest.fn()
		} as any

		guard = new AuthGuard(jwtService, usersService)
	})

	function createMockContext(req: any) {
		return {
			switchToHttp: () => ({
				getRequest: () => req
			})
		} as any
	}

	it('should throw 401 if no token', async () => {
		const ctx = createMockContext({ session: {} })

		await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
	})

	it('should throw 401 if token invalid', async () => {
		const ctx = createMockContext({
			session: { token: 'bad-token' }
		})
		;(jwtService.verifyAsync as jest.Mock).mockRejectedValue(
			UnauthorizedException
		)

		await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
	})

	it('should throw 401 if user not found', async () => {
		const ctx = createMockContext({
			session: { token: 'bad-token' }
		})
		;(jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: '123' })
		;(usersService.findByIdNoValidation as jest.Mock).mockResolvedValue(null)

		await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
	})

	it('should return true if valid token and user exists', async () => {
		const ctx = createMockContext({
			session: { token: 'bad-token' }
		})
		;(jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: '123' })
		;(usersService.findByIdNoValidation as jest.Mock).mockResolvedValue(
			mockUser
		)

		const result = await guard.canActivate(ctx)

		expect(result).toBe(true)
	})
})
