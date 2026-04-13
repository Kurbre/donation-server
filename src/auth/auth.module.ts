import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { ConfigModule } from '@nestjs/config'
import { MailModule } from '../mail/mail.module'

@Module({
	controllers: [AuthController],
	providers: [AuthService],
	imports: [UsersModule, ConfigModule, MailModule]
})
export class AuthModule {}
