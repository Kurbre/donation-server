import { Injectable } from '@nestjs/common'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'
import { type MongoType } from 'src/utils/types/mongo-type'
import { InjectModel } from '@nestjs/mongoose'
import { Note } from './notes.model'
import { Model } from 'mongoose'
import { User } from 'src/users/users.model'

@Injectable()
export class NotesService {
	constructor(
		@InjectModel(Note.name) private readonly noteModel: Model<Note>,
		@InjectModel(User.name) private readonly userModel: Model<User>
	) {}

	async create(userId: MongoType) {
		return await this.noteModel.create({
			user: userId
		})
	}

	async findAll() {
		return `This action returns all notes`
	}

	async findOne(id: string) {
		return `This action returns a #${id} note`
	}

	async update(id: string, dto: UpdateNoteDto) {
		return `This action updates a #${id} note`
	}

	async remove(id: string) {
		return `This action removes a #${id} note`
	}
}
