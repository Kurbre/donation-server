import { HttpStatus } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

const getErrorName = (status: number) => {
	const rawName = HttpStatus[status] || 'Error'

	return rawName
		.toLowerCase()
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

export const ErrorApiResponse = (
	status: number,
	description: string,
	message: string
) =>
	ApiResponse({
		status: status,
		description,
		schema: {
			example: {
				message,
				error: getErrorName(status),
				statusCode: status
			}
		}
	})
