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
import { UpdateNoteDto } from './dto/update-note.dto'
import { Auth } from '../auth/decorators/auth.decorator'
import { GetUser } from '../users/decorators/users.decorator'
import { type MongoType } from '../utils/types/mongo-type'

@Controller('notes')
export class NotesController {
	constructor(private readonly notesService: NotesService) {}

	@Auth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(@GetUser('_id') userId: MongoType) {
		return this.notesService.create(userId)
	}

	@Patch(':id')
	update(@Param('id') id: MongoType, @Body() dto: UpdateNoteDto) {
		return this.notesService.update(id, dto)
	}
}
