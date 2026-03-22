import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { hash } from 'argon2'

@Injectable()
export class UsersService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(dto: CreateUserDto) {
		const isFindedUser = await this.prismaService.user.findUnique({
			where: {
				email: dto.email
			}
		})
		if (isFindedUser)
			throw new BadRequestException(
				'Пользователь с таким email уже зарегестрирован'
			)

		const hashPassword = await hash(dto.password)

		return await this.prismaService.user.create({
			data: {
				...dto,
				password: hashPassword
			},
			select: {
				id: true,
				name: true,
				surname: true,
				email: true,
				createdAt: true,
				updatedAt: true
			}
		})
	}

	async findByEmail(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: { email }
		})
		if (!user)
			throw new NotFoundException('Пользователь с таким Email не найден')

		return user
	}

	async isNotHasUser(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: {
				email
			}
		})
		if (user)
			throw new BadRequestException(
				'Пользователь с таким email уже зарегестрирован'
			)
	}
}
