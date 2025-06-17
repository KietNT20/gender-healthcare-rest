import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mood } from './entities/mood.entity';
import { MoodsController } from './moods.controller';
import { MoodsService } from './moods.service';

@Module({
    imports: [TypeOrmModule.forFeature([Mood])],
    controllers: [MoodsController],
    providers: [MoodsService],
    exports: [MoodsService],
})
export class MoodsModule {}
