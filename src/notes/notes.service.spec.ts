import { Test, TestingModule } from '@nestjs/testing'
import { NotesService } from './notes.service'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '../auth/guards/auth.guard'
import { getModelToken } from '@nestjs/mongoose'
import { Note } from './notes.model'
import { User } from '../users/users.model'

const note = {
	_id: '69982f8f4f4a39614efdf1ba',
	title: 'Untitled',
	text: '',
	isEditMode: true,
	createdAt: '2026-02-20T09:55:27.795Z',
	updatedAt: '2026-02-20T09:55:27.795Z',
	__v: 0
}

const updateDto = {
	title: 'Updated title',
	text: 'Updated text',
	isEditMode: false
}

describe('NotesService', () => {
	let service: NotesService

	const mockNoteModel = {
		create: jest.fn().mockResolvedValue(note),
		findByIdAndUpdate: jest.fn()
	}

	const mockUserModel = {
		findByIdAndUpdate: jest.fn().mockResolvedValue({})
	}

	beforeEach(async () => {
		jest.clearAllMocks()
		mockNoteModel.create.mockResolvedValue(note)
		mockNoteModel.findByIdAndUpdate.mockResolvedValue({
			...note,
			...updateDto
		})
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotesService,
				{
					provide: JwtService,
					useValue: {
						signAsync: jest.fn(),
						verifyAsync: jest.fn()
					}
				},
				{
					provide: getModelToken('Note'),
					useValue: mockNoteModel
				},
				{
					provide: getModelToken('User'),
					useValue: mockUserModel
				}
			]
		}).compile()

		service = module.get<NotesService>(NotesService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	it('should be created note', async () => {
		const result = await service.create('userId')
		expect(result).toEqual(note)
		expect(mockNoteModel.create).toHaveBeenCalledWith({ user: 'userId' })
	})

	it('should be updated note', async () => {
		const result = await service.update(note._id, updateDto)
		expect(result).toEqual({
			...note,
			title: updateDto.title,
			text: updateDto.text,
			isEditMode: updateDto.isEditMode
		})
		expect(mockNoteModel.findByIdAndUpdate).toHaveBeenCalledWith(
			note._id,
			updateDto,
			{ new: true }
		)
	})
})
