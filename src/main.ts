import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import session from 'express-session'
import { AppModule } from './app.module'

const pgSession = require('connect-pg-simple')

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const config = app.get(ConfigService)
	const pgStore = pgSession(session)

	app.setGlobalPrefix('api')

	app.enableCors({
		origin: config.getOrThrow<string>('CLIENT_URL'),
		credentials: true
	})

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	app.use(
		session({
			name: config.getOrThrow<string>('COOKIE_NAME'),
			secret: config.getOrThrow<string>('COOKIE_SECRET_KEY'),
			resave: false, // Не сохранять сессию, если она не менялась
			saveUninitialized: false, // Не создавать сессию, пока в неё что-то не записали
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 3, // 3 дня
				httpOnly: true, // Защита от XSS
				secure: false // true только если используете HTTPS
			},
			store: new pgStore({
				conString: config.getOrThrow<string>('DATABASE_URL'),
				tableName: 'sessions'
			})
		})
	)

	const docs = new DocumentBuilder()
		.setTitle('Donation')
		.setDescription('The donation API description')
		.setVersion('1.0')
		.build()
	const documentFactory = () => SwaggerModule.createDocument(app, docs)
	SwaggerModule.setup('docs', app, documentFactory)

	await app.listen(config.getOrThrow<string>('APP_PORT') ?? 3000)
}
bootstrap()
