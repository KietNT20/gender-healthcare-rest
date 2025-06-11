import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  async create(@Body() createBlogDto: CreateBlogDto) {
    return await this.blogsService.create(createBlogDto);
  }

  @Get()
  async findAll() {
    return await this.blogsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.blogsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return await this.blogsService.update(id, updateBlogDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.blogsService.remove(id);
  }
}