import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { ResponseMessage } from 'src/decorators/response-message.decorator';

@ApiBearerAuth()
@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  @ResponseMessage('Tag created successfully')
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  @ResponseMessage('Tags retrieved successfully')
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag retrieved successfully' })
  @ResponseMessage('Tag retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.ADMIN, RolesNameEnum.MANAGER])
  @ApiOperation({ summary: 'Update tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ResponseMessage('Tag updated successfully')
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles([RolesNameEnum.ADMIN])
  @ApiOperation({ summary: 'Delete tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ResponseMessage('Tag deleted successfully')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}