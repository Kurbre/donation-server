import { Test, TestingModule } from '@nestjs/testing'
import { NotesController } from './notes.controller'
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

describe('NotesController', () => {
	let controller: NotesController

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NotesController],
			providers: [
				{
					provide: NotesService,
					useValue: {
						create: jest.fn().mockResolvedValue(note),
						update: jest.fn().mockResolvedValue(note)
					}
				},
				{
					provide: JwtService,
					useValue: {
						signAsync: jest.fn(),
						verifyAsync: jest.fn()
					}
				}
			]
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: () => true })
			.compile()

		controller = module.get<NotesController>(NotesController)
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	it('should be created note', async () => {
		expect(controller.create('sdfksjdfjk')).resolves.toEqual(note)
	})
})
