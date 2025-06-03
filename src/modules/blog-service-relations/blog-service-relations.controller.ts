import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlogServiceRelationsService } from './blog-service-relations.service';
import { CreateBlogServiceRelationDto } from './dto/create-blog-service-relation.dto';
import { UpdateBlogServiceRelationDto } from './dto/update-blog-service-relation.dto';

@Controller('blog-service-relations')
export class BlogServiceRelationsController {
  constructor(private readonly blogServiceRelationsService: BlogServiceRelationsService) {}

  @Post()
  create(@Body() createBlogServiceRelationDto: CreateBlogServiceRelationDto) {
    return this.blogServiceRelationsService.create(createBlogServiceRelationDto);
  }

  @Get()
  findAll() {
    return this.blogServiceRelationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogServiceRelationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogServiceRelationDto: UpdateBlogServiceRelationDto) {
    return this.blogServiceRelationsService.update(+id, updateBlogServiceRelationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogServiceRelationsService.remove(+id);
  }
}
