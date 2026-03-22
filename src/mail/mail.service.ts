import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type Data, renderFile } from 'ejs'
import * as nodemailer from 'nodemailer'
import { join } from 'path'
import juice from 'juice'

@Injectable()
export class MailService {
	private transporter

	constructor(private readonly configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true, // true для 465, false для других портов
			auth: {
				user: this.configService.getOrThrow<string>('SMTP_USER'),
				pass: this.configService.getOrThrow<string>('SMTP_PASS')
			}
		})
	}

	async sendMail(to: string, subject: string, html: string) {
		return this.transporter.sendMail({
			from: `"Donation" <${this.configService.getOrThrow<string>('SMTP_USER')}>`,
			to,
			subject,
			html
		})
	}

	async getTemplate<T extends Data>(templateName: string, data?: T) {
		const file = join(
			process.cwd(),
			'src',
			'utils',
			'templates',
			`${templateName}.ejs`
		)
		const template = await renderFile(file, data || {})

		return juice(template)
	}
}
