import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogServiceRelationDto } from './create-blog-service-relation.dto';

export class UpdateBlogServiceRelationDto extends PartialType(CreateBlogServiceRelationDto) {}
