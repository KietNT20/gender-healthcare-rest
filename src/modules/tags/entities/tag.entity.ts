import { Blog } from 'src/modules/blogs/entities/blog.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @Column({ unique: true })
    slug: string;

    // Relations
    @ManyToMany(() => Blog, (blog) => blog.tags)
    blogs: Blog[];
}
