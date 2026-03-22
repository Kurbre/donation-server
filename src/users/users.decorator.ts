import { createParamDecorator } from '@nestjs/common'
import { User } from '@prisma/client'

export const GetUser = createParamDecorator((data: keyof User, ctx) => {
	const req = ctx.switchToHttp().getRequest()

	const user = req.user

	return data ? user?.[data] : user
})
