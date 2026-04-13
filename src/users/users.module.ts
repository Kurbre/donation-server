import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { MailModule } from '../mail/mail.module'
import { ConfigModule } from '@nestjs/config'

@Module({
	controllers: [UsersController],
	providers: [UsersService],
	imports: [MailModule, ConfigModule],
	exports: [UsersService]
})
export class UsersModule {}
