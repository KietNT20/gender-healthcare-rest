import { Injectable, NotFoundException } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { CreateBlogDto } from './dto/create-blog.dto';
  import { UpdateBlogDto } from './dto/update-blog.dto';
  import { Blog } from './entities/blog.entity';
  import { Category } from 'src/modules/categories/entities/category.entity';

  @Injectable()
  export class BlogsService {
      constructor(
          @InjectRepository(Blog) private blogRepository: Repository<Blog>,
          @InjectRepository(Category) private categoryRepository: Repository<Category>,
      ) {}

      async create(createBlogDto: CreateBlogDto) {
          if (createBlogDto.categoryId) {
              const category = await this.categoryRepository.findOne({ where: { id: createBlogDto.categoryId } });
              if (!category) {
                  throw new NotFoundException('Category not found');
              }
          }
          const blog = this.blogRepository.create(createBlogDto);
          return this.blogRepository.save(blog);
      }

      async findAll() {
          return this.blogRepository.find({ relations: ['category'] });
      }

      async findOne(id: string) {
          const blog = await this.blogRepository.findOne({ where: { id }, relations: ['category'] });
          if (!blog) {
              throw new NotFoundException(`Blog with ID ${id} not found`);
          }
          return blog;
      }

      async update(id: string, updateBlogDto: UpdateBlogDto) {
          const blog = await this.blogRepository.findOne({ where: { id } });
          if (!blog) {
              throw new NotFoundException(`Blog with ID ${id} not found`);
          }
          if (updateBlogDto.categoryId) {
              const category = await this.categoryRepository.findOne({ where: { id: updateBlogDto.categoryId } });
              if (!category) {
                  throw new NotFoundException('Category not found');
              }
          }
          Object.assign(blog, updateBlogDto);
          return this.blogRepository.save(blog);
      }

      async remove(id: string) {
          const blog = await this.blogRepository.findOne({ where: { id } });
          if (!blog) {
              throw new NotFoundException(`Blog with ID ${id} not found`);
          }
          return this.blogRepository.remove(blog);
      }
  }