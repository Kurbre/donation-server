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
		origin: [config.getOrThrow<string>('CLIENT_URL'), 'http://localhost:3000'],
		credentials: true
	})

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	const isProd = config.get<string>('NODE_ENV') === 'production'

	app.use(
		session({
			name: config.getOrThrow<string>('COOKIE_NAME'),
			secret: config.getOrThrow<string>('COOKIE_SECRET_KEY'),
			resave: false, // Не сохранять сессию, если она не менялась
			saveUninitialized: false, // Создавать сессию сразу для установки куки
			proxy: true, // Для работы с прокси (render.com, nginx)
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 3, // 3 дня
				httpOnly: true, // Защита от XSS
				secure: isProd, // Обязательно true на HTTPS
				sameSite: 'lax', // sameSite=none требует secure: true
				path: '/' // НЕ устанавливаем domain для кросс-доменных запросов
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
