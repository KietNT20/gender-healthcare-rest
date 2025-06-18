import { Controller } from '@nestjs/common';
import { CycleMoodsService } from './cycle-moods.service';

@Controller('cycle-moods')
export class CycleMoodsController {
    constructor(private readonly cycleMoodsService: CycleMoodsService) {}

    // @Post()
    // create(@Body() createCycleMoodDto: CreateCycleMoodDto) {
    //     return this.cycleMoodsService.create(createCycleMoodDto);
    // }

    // @Get()
    // findAll() {
    //     return this.cycleMoodsService.findAll();
    // }

    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //     return this.cycleMoodsService.findOne(+id);
    // }

    // @Patch(':id')
    // update(
    //     @Param('id') id: string,
    //     @Body() updateCycleMoodDto: UpdateCycleMoodDto,
    // ) {
    //     return this.cycleMoodsService.update(+id, updateCycleMoodDto);
    // }

    // @Delete(':id')
    // remove(@Param('id') id: string) {
    //     return this.cycleMoodsService.remove(+id);
    // }
}
