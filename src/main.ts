import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import session from 'express-session'
import { AppModule } from './app.module'

const pgSession = require('connect-pg-simple')

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	// Для render.com
	app.getHttpAdapter().getInstance().set('trust proxy', 1)
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

	const isProd = config.get<string>('NODE_ENV') === 'production'

	// Извлекаем домен из CLIENT_URL
	const clientUrl = config.getOrThrow<string>('CLIENT_URL')
	const clientDomain = new URL(clientUrl).hostname

	console.log(isProd, clientUrl, clientDomain)

	app.use(
		session({
			name: config.getOrThrow<string>('COOKIE_NAME'),
			secret: config.getOrThrow<string>('COOKIE_SECRET_KEY'),
			resave: false, // Не сохранять сессию, если она не менялась
			saveUninitialized: true, // Создавать сессию сразу для установки куки
			proxy: true, // Для работы с прокси (render.com, nginx)
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 3, // 3 дня
				httpOnly: true, // Защита от XSS
				secure: isProd, // Обязательно true на HTTPS
				sameSite: isProd ? 'none' : 'lax', // sameSite=none требует secure: true
				path: '/',
				domain: clientDomain // Извлечено из CLIENT_URL
			},
			store: new pgStore({
				conString: config.getOrThrow<string>('DATABASE_URL'),
				tableName: 'sessions',
				errorLog: console.error
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
