import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import session from 'express-session'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../app.module'
import { USERS_ERRORS } from '../users/constants/users-errors'
import { PrismaService } from '../prisma/prisma.service'

describe('Users and auth (e2e)', () => {
	let app: INestApplication<App>
	let cookie
	let prisma: PrismaService

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

		prisma = app.get(PrismaService)

		await app.init()
	})

	afterAll(async () => {
		await prisma.user.delete({
			where: {
				email: 'test@gmail.com'
			}
		})

		await app.close()
	})

	it('Register (Post)', async () => {
		const registerResult = await request(app.getHttpServer())
			.post('/auth/register')
			.send({
				email: 'test@gmail.com',
				name: 'Test',
				surname: 'Test',
				password: '123123'
			})
			.expect(200)

		expect(registerResult.body).toHaveProperty('message')

		const token = await prisma.pendingUser.findFirst({
			where: {
				email: 'test@gmail.com'
			}
		})

		const confirmedRegisterResult = await request(app.getHttpServer())
			.post(`/auth/confirmed-register?token=${token?.token}`)
			.expect(201)

		expect(confirmedRegisterResult.body).toHaveProperty('email')
		expect(confirmedRegisterResult.body).toHaveProperty('name')
		expect(confirmedRegisterResult.body).toHaveProperty('surname')

		cookie = confirmedRegisterResult.headers['set-cookie']
	})

	it('Get profile (GET)', async () => {
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
				email: 'test@gmail.com'
			})
			.expect(200)

		expect(sendMailResponse.body).toEqual({
			message: USERS_ERRORS.SENDING_MAIL
		})

		const tokenRecord = await prisma.token.findFirst({
			where: {
				email: 'test@gmail.com',
				type: 'RESET_PASSWORD'
			}
		})

		expect(tokenRecord).toBeDefined()

		const findTokenResult = await request(app.getHttpServer())
			.get(`/users/reset-password-token/${tokenRecord?.id}`)
			.expect(200)

		expect(findTokenResult.body).toBeDefined()

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
				email: 'test@gmail.com',
				password: 'newPassword'
			})
			.expect(200)

		cookie = resAuth.headers['set-cookie']

		expect(resAuth.body).toHaveProperty('email')
	})

	it('Change password (Post)', async () => {
		const changePassword = await request(app.getHttpServer())
			.post('/users/change-password')
			.set('Cookie', cookie)
			.send({
				password: 'qwerty'
			})
			.expect(200)

		expect(changePassword.body).toHaveProperty('message')

		const login = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: 'test@gmail.com',
				password: 'qwerty'
			})
			.expect(200)

		cookie = login.headers['set-cookie']
	})

	it('Logout (Post)', async () => {
		const logoutResult = await request(app.getHttpServer())
			.post('/auth/logout')
			.set('Cookie', cookie)
			.expect(200)

		expect(logoutResult.body).toHaveProperty('message')
	})
})
