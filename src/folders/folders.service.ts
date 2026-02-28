import { Injectable } from '@nestjs/common'
import { CreateFolderDto } from './dto/create-folder.dto'
import { UpdateFolderDto } from './dto/update-folder.dto'
import { MongoType } from '../utils/types/mongo-type'
import { InjectModel } from '@nestjs/mongoose'
import { Folder, FolderDocument } from './folders.model'
import { Model } from 'mongoose'
import { Note } from 'src/notes/notes.model'
import { User } from 'src/users/users.model'
import { max } from 'class-validator'

@Injectable()
export class FoldersService {
	constructor(
		@InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
		@InjectModel(User.name) private readonly userModel: Model<User>
	) {}

	async create(dto: CreateFolderDto, userId: MongoType) {
		const folders = await this.folderModel
			.find()
			.populate<{ notes: Note[] }>({
				path: 'notes',
				options: { sort: { order: 1 } }
			})
			.exec()

		const maxOrder =
			folders!.length > 0 ? Math.max(...folders!.map(n => n.order)) : 0

		const folder = (await this.folderModel.create({
			user: userId,
			title: dto.title,
			order: maxOrder
		})) as FolderDocument

		await this.userModel.findByIdAndUpdate(userId, {
			$push: {
				folders: folder._id
			}
		})

		return folder
	}

	findAll() {
		return `This action returns all folders`
	}

	findOne(id: number) {
		return `This action returns a #${id} folder`
	}

	update(id: number, updateFolderDto: UpdateFolderDto) {
		return `This action updates a #${id} folder`
	}

	remove(id: number) {
		return `This action removes a #${id} folder`
	}
}
