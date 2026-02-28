import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument } from 'mongoose'
import { Note } from 'src/notes/notes.model'
import { MongoType } from '../utils/types/mongo-type'
import { Folder } from 'src/folders/folders.model'

export type UserDocument = HydratedDocument<User>

@Schema({
	timestamps: true
})
export class User {
	@Prop({ unique: true })
	login: string

	@Prop({ unique: true })
	email: string

	@Prop({ select: false })
	password: string

	@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }] })
	notes: Note[]

	@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }] })
	folders: Folder[]
}

export const UserSchema = SchemaFactory.createForClass(User)
