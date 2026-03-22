import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService
	) {}

	async canActivate(ctx: ExecutionContext) {
		const req = ctx.switchToHttp().getRequest()

		const token = req.session.token

		if (!token) throw new UnauthorizedException('Вы не авторизованы')

		try {
			const decoded = await this.jwtService.verifyAsync(token)

			const user = await this.usersService.findByIdNoValidation(decoded.sub)
			if (!user) throw new UnauthorizedException('Вы не авторизованы')

			req.user = user

			return true
		} catch (error) {
			console.log(error)

			throw new UnauthorizedException('Вы не авторизованы')
		}
	}
}
