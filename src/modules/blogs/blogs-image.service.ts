import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Repository } from 'typeorm';
import { Image } from '../images/entities/image.entity';
import { CreateBlogImageDTO } from './dto/create-blog-image.dto';

@Injectable()
export class BlogImageService {
    constructor(
        @InjectRepository(Blog)
        private readonly blogRepository: Repository<Blog>,
        @InjectRepository(Image)
        private readonly imageRepository: Repository<Image>,
    ) {}

    async syncBlogImages(blogId: string): Promise<void> {
        // Find the blog
        const blog = await this.blogRepository.findOne({
            where: { id: blogId },
            relations: ['images'],
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${blogId} not found`);
        }

        // Find images where entityType is 'blog' and entityId matches blogId
        const images = await this.imageRepository.find({
            where: {
                entityType: 'blog',
                entityId: blogId,
            },
        });

        // Update the blog's images relation
        blog.images = images;
        await this.blogRepository.save(blog);
    }

    async addImageToBlog(createBlogImageDTO:CreateBlogImageDTO): Promise<void> {
        const {blogId,imageId} = createBlogImageDTO
        // Find the blog

        const blog = await this.blogRepository.findOne({
            where: { id: blogId },
            relations: ['images'],
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${blogId} not found`);
        }

        // Find the image
        const image = await this.imageRepository.findOne({
            where: {
                id: imageId,
                entityType: 'blog',
                entityId: blogId,
            },
        });

        if (!image) {
            throw new NotFoundException(`Image with ID ${imageId} not found or not associated with blog`);
        }

        // Add image to blog's images array if not already present
        if (!blog.images.some(img => img.id === imageId)) {
            blog.images.push(image);
            await this.blogRepository.save(blog);
        }
    }

    async removeImageFromBlog(createBlogImageDTO: CreateBlogImageDTO): Promise<void> {
        const {blogId,imageId} = createBlogImageDTO
        // Find the blog
        const blog = await this.blogRepository.findOne({
            where: { id: blogId },
            relations: ['images'],
        });

        if (!blog) {
            throw new NotFoundException(`Blog with ID ${blogId} not found`);
        }

        // Filter out the image
        blog.images = blog.images.filter(img => img.id !== imageId);
        await this.blogRepository.save(blog);
    }
}