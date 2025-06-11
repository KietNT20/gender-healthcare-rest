import { Injectable } from '@nestjs/common';
import { CreateBlogServiceRelationDto } from './dto/create-blog-service-relation.dto';
import { UpdateBlogServiceRelationDto } from './dto/update-blog-service-relation.dto';

@Injectable()
export class BlogServiceRelationsService {
    create(createBlogServiceRelationDto: CreateBlogServiceRelationDto) {
        return 'This action adds a new blogServiceRelation';
    }

    findAll() {
        return `This action returns all blogServiceRelations`;
    }

    findOne(id: number) {
        return `This action returns a #${id} blogServiceRelation`;
    }

    update(
        id: number,
        updateBlogServiceRelationDto: UpdateBlogServiceRelationDto,
    ) {
        return `This action updates a #${id} blogServiceRelation`;
    }

    remove(id: number) {
        return `This action removes a #${id} blogServiceRelation`;
    }
}
