import { Test, TestingModule } from '@nestjs/testing'
import { NotesService } from './notes.service'

const note = {
	title: 'Untitled',
	text: '',
	isEditMode: true,
	_id: '69982f8f4f4a39614efdf1ba',
	createdAt: '2026-02-20T09:55:27.795Z',
	updatedAt: '2026-02-20T09:55:27.795Z',
	__v: 0
}

describe('NotesService', () => {
	let service: NotesService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [NotesService]
		}).compile()

		service = module.get<NotesService>(NotesService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	it('should be created note', async () => {})
})
