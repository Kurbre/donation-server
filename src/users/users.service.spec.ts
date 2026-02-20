import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'argon2'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import { UsersService } from './users.service'
import { User } from './users.model'
import { CreateUserDto } from './dto/create-user.dto'

jest.mock('argon2', () => ({
	hash: jest.fn()
}))

const user = {
	_id: uuidv4(),
	login: 'dfgdfgdfggdf',
	email: 'gdfdfg@gmail.com',
	createdAt: '2026-02-12T18:40:48.402Z',
	updatedAt: '2026-02-12T18:40:48.402Z',
	__v: 0
}

const dto: CreateUserDto = {
	login: user.email,
	password: 'test123',
	email: user.email
}

describe('UsersService', () => {
	let service: UsersService
	let model: jest.Mocked<Model<User>>

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getModelToken(User.name),
					useValue: {
						findOne: jest.fn(),
						findById: jest.fn(),
						create: jest.fn()
					}
				}
			]
		}).compile()

		service = module.get<UsersService>(UsersService)
		model = module.get(getModelToken(User.name))
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	// -------------------------
	// findUser
	// -------------------------
	it('findUser: should return user by search value', async () => {
		;(model.findOne as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(user)
		})

		const result = await service.findUser(user.email)

		expect(model.findOne).toHaveBeenCalledWith({
			$or: [{ email: user.email }, { login: user.email }]
		})
		expect(result).toEqual(user)
	})

	it('findUser: should throw NotFoundException when user not found', async () => {
		;(model.findOne as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(null)
		})

		await expect(service.findUser('noone@mail.com')).rejects.toBeInstanceOf(
			NotFoundException
		)
		await expect(service.findUser('noone@mail.com')).rejects.toThrow(
			'Пользователь не найден'
		)
	})

	// -------------------------
	// findUserSelectedPassword
	// -------------------------
	it('findUserSelectedPassword: should return user with selected password', async () => {
		;(model.findOne as any).mockReturnValue({
			select: jest.fn().mockReturnThis(),
			exec: jest.fn().mockResolvedValue(user)
		})

		const result = await service.findUserSelectedPassword(user.email)

		expect(model.findOne).toHaveBeenCalledWith({
			$or: [{ email: user.email }, { login: user.email }]
		})
		// Проверяем, что select('password') был вызван
		const query = (model.findOne as any).mock.results[0].value
		expect(query.select).toHaveBeenCalledWith('password')

		expect(result).toEqual(user)
	})

	it('findUserSelectedPassword: should throw NotFoundException when user not found', async () => {
		;(model.findOne as any).mockReturnValue({
			select: jest.fn().mockReturnThis(),
			exec: jest.fn().mockResolvedValue(null)
		})

		await expect(
			service.findUserSelectedPassword('noone@mail.com')
		).rejects.toBeInstanceOf(NotFoundException)

		await expect(
			service.findUserSelectedPassword('noone@mail.com')
		).rejects.toThrow('Пользователь не найден')
	})

	// -------------------------
	// findById
	// -------------------------
	it('findById: should return user by id', async () => {
		;(model.findById as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(user)
		})

		const result = await service.findById(user._id)

		expect(model.findById).toHaveBeenCalledWith(user._id)
		expect(result).toEqual(user)
	})

	it('findById: should throw NotFoundException when user not found', async () => {
		;(model.findById as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(null)
		})

		await expect(service.findById(user._id)).rejects.toBeInstanceOf(
			NotFoundException
		)
		await expect(service.findById(user._id)).rejects.toThrow(
			'Пользователь не найден'
		)
	})

	// -------------------------
	// findByIdNoValidation
	// -------------------------
	it('findByIdNoValidation: should return user by id (or null) without throwing', async () => {
		;(model.findById as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(user)
		})

		const result = await service.findByIdNoValidation(user._id)

		expect(model.findById).toHaveBeenCalledWith(user._id)
		expect(result).toEqual(user)
	})

	it('findByIdNoValidation: should return null when user not found', async () => {
		;(model.findById as any).mockReturnValue({
			exec: jest.fn().mockResolvedValue(null)
		})

		const result = await service.findByIdNoValidation(user._id)

		expect(result).toBeNull()
	})

	// -------------------------
	// create
	// -------------------------
	it('create: should create user with hashed password', async () => {
		// ВАЖНО: create() у тебя делает await this.userModel.findOne(...) БЕЗ exec()
		// Поэтому findOne должен быть Promise-резолвящимся значением:
		;(model.findOne as any).mockResolvedValue(null)
		;(hash as jest.Mock).mockResolvedValue('hash')
		model.create.mockResolvedValue(user as any)

		const result = await service.create(dto)

		expect(model.findOne).toHaveBeenCalledWith({
			$or: [{ email: dto.email }, { login: dto.login }]
		})
		expect(hash).toHaveBeenCalledWith(dto.password)

		expect(model.create).toHaveBeenCalledWith({
			...dto,
			password: 'hash'
		})

		expect(result).toEqual(user)
	})

	it('create: should throw BadRequestException when user already exists', async () => {
		;(model.findOne as any).mockResolvedValue(user)

		await expect(service.create(dto)).rejects.toBeInstanceOf(
			BadRequestException
		)
		await expect(service.create(dto)).rejects.toThrow(
			'Пользователь с такими данными уже существует'
		)

		expect(model.create).not.toHaveBeenCalled()
	})

	it('create: should throw when hash failed', async () => {
		;(model.findOne as any).mockResolvedValue(null)
		;(hash as jest.Mock).mockRejectedValue(new Error('hash failed'))

		await expect(service.create(dto)).rejects.toThrow('hash failed')
		expect(model.create).not.toHaveBeenCalled()
	})

	it('create: should throw when model.create failed', async () => {
		;(model.findOne as any).mockResolvedValue(null)
		;(hash as jest.Mock).mockResolvedValue('hash')
		model.create.mockRejectedValue(new Error('db failed'))

		await expect(service.create(dto)).rejects.toThrow('db failed')
	})
})
