import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { User } from '../users/users.model'
import { MongoType } from '../utils/types/mongo-type'

export type NoteDocument = HydratedDocument<Note>

@Schema({
	timestamps: true
})
export class Note {
	@Prop({ default: 'Untitled' })
	title: string

	@Prop({ default: '' })
	text: string

	@Prop({ default: true })
	isEditMode: boolean

	@Prop({ type: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } })
	user: MongoType | User
}

export const NoteSchema = SchemaFactory.createForClass(Note)
