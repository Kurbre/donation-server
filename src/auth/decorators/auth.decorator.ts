import { applyDecorators, HttpStatus, UseGuards } from '@nestjs/common'
import { ErrorApiResponse } from 'src/utils/decorators/error-api-response.decorator'
import { AuthGuard } from '../guards/auth.guard'

export const Auth = () =>
	applyDecorators(
		UseGuards(AuthGuard),
		ErrorApiResponse(
			HttpStatus.UNAUTHORIZED,
			'Пользователь не авторизован',
			'Вы не авторизованы'
		)
	)
