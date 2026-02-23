import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { mongoConfig } from './config/mongo.config'
import { UsersModule } from './users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { jwtConfig } from './config/jwt.config'
import { AuthModule } from './auth/auth.module'
import { NotesModule } from './notes/notes.module'
import { FoldersModule } from './folders/folders.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env'
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: mongoConfig
		}),
		JwtModule.registerAsync({
			global: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: jwtConfig
		}),
		UsersModule,
		AuthModule,
		NotesModule,
		FoldersModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
