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
import { FoldersService } from './folders.service'
import { CreateFolderDto } from './dto/create-folder.dto'
import { UpdateFolderDto } from './dto/update-folder.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { GetUser } from 'src/users/decorators/users.decorator'

@Controller('folders')
export class FoldersController {
	constructor(private readonly foldersService: FoldersService) {}

	@Auth()
	@Post()
	@HttpCode(HttpStatus.CREATED)
	create(
		@Body() createFolderDto: CreateFolderDto,
		@GetUser('_id') userId: string
	) {
		return this.foldersService.create(createFolderDto, userId)
	}

	@Get()
	findAll() {
		return this.foldersService.findAll()
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.foldersService.findOne(+id)
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
		return this.foldersService.update(+id, updateFolderDto)
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.foldersService.remove(+id)
	}
}
