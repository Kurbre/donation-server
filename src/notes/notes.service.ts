import { Injectable } from '@nestjs/common'
import { UpdateNoteDto } from './dto/update-note.dto'
import { type MongoType } from 'src/utils/types/mongo-type'
import { InjectModel } from '@nestjs/mongoose'
import { Note } from './notes.model'
import { Model } from 'mongoose'
import { User } from '../users/users.model'

@Injectable()
export class NotesService {
	constructor(
		@InjectModel(Note.name) private readonly noteModel: Model<Note>,
		@InjectModel(User.name) private readonly userModel: Model<User>
	) {}

	async create(userId: MongoType) {
		const note = await this.noteModel.create({
			user: userId
		})

		await this.userModel.findByIdAndUpdate(userId, {
			$push: { notes: note._id }
		})

		return note
	}

	async update(id: MongoType, dto: UpdateNoteDto) {
		return await this.noteModel.findByIdAndUpdate(id, dto, { new: true })
	}
}
