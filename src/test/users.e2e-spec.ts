import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import session from 'express-session'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../app.module'
import { USERS_ERRORS } from '../users/constants/users-errors'
import { PrismaService } from '../prisma/prisma.service'

describe('Users Controller (e2e)', () => {
	let app: INestApplication<App>
	let cookie

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AppModule]
		}).compile()

		app = module.createNestApplication()

		app.use(
			session({
				secret: 'test',
				resave: false,
				saveUninitialized: false
			})
		)

		app.enableShutdownHooks()

		await app.init()

		const resAuth = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: 'catiklou@gmail.com',
				password: '123123'
			})
			.expect(200)

		cookie = resAuth.headers['set-cookie']
	})

	afterAll(async () => {
		await request(app.getHttpServer())
			.post('/users/change-password')
			.set('Cookie', cookie)
			.send({
				password: '123123'
			})
			.expect(200)

		await app.close()
	})

	it('/users/profile (GET)', async () => {
		const result = await request(app.getHttpServer())
			.get('/users/profile')
			.set('Cookie', cookie)
			.expect(200)

		expect(result.body).toHaveProperty('email')
		expect(result.body).toHaveProperty('name')
		expect(result.body).toHaveProperty('surname')
	})

	it('Reset password (Post)', async () => {
		const sendMailResponse = await request(app.getHttpServer())
			.post('/users/send-reset-password')
			.send({
				email: 'catiklou@gmail.com'
			})
			.expect(200)

		expect(sendMailResponse.body).toEqual({
			message: USERS_ERRORS.SENDING_MAIL
		})

		const prisma = app.get(PrismaService)

		const tokenRecord = await prisma.token.findFirst({
			where: {
				email: 'catiklou@gmail.com',
				type: 'RESET_PASSWORD'
			}
		})

		expect(tokenRecord).toBeDefined()

		const sendResetPasswordResponse = await request(app.getHttpServer())
			.post('/users/reset-password')
			.send({
				token: tokenRecord!.id,
				password: 'newPassword'
			})
			.expect(200)

		expect(sendResetPasswordResponse.body).toEqual({
			message: USERS_ERRORS.SUCCESS_RESET_PASSWORD
		})

		const resAuth = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: 'catiklou@gmail.com',
				password: 'newPassword'
			})
			.expect(200)

		cookie = resAuth.headers['set-cookie']

		expect(resAuth.body).toHaveProperty('email')
	})
})
