import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, {
	HydratedDocument,
	type Types,
	type PopulatedDoc
} from 'mongoose'
import { User } from '../users/users.model'
import { Note } from 'src/notes/notes.model'

export type FolderDocument = HydratedDocument<Folder>

@Schema({
	timestamps: true
})
export class Folder {
	@Prop({ default: 'Untitled' })
	title: string

	@Prop()
	order: number

	@Prop({ type: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } })
	user: PopulatedDoc<User & Types.Subdocument>

	@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }] })
	notes: Note[]
}

export const FolderSchema = SchemaFactory.createForClass(Folder)
