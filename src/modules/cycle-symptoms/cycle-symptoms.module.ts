import { Module } from '@nestjs/common';
import { CycleSymptomsService } from './cycle-symptoms.service';
import { CycleSymptomsController } from './cycle-symptoms.controller';

@Module({
    controllers: [CycleSymptomsController],
    providers: [CycleSymptomsService],
})
export class CycleSymptomsModule {}
