import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	HttpCode,
	HttpStatus
} from '@nestjs/common'
import { NotesService } from './notes.service'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { GetUser } from 'src/users/decorators/users.decorator'
import { type MongoType } from 'src/utils/types/mongo-type'

@Controller('notes')
export class NotesController {
	constructor(private readonly notesService: NotesService) {}

	@Auth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@GetUser('_id') userId: MongoType) {
		return this.notesService.create(userId)
	}

	@Get()
	findAll() {
		return this.notesService.findAll()
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.notesService.findOne(id)
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
		return this.notesService.update(id, dto)
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.notesService.remove(id)
	}
}
