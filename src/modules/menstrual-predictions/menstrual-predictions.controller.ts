import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { MenstrualPredictionsService } from './menstrual-predictions.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menstrual-predictions')
export class MenstrualPredictionsController {
    constructor(
        private readonly menstrualPredictionsService: MenstrualPredictionsService,
    ) {}

    @Get('me')
    @ApiOperation({
        summary: 'Get my menstrual predictions',
    })
    getMyPredictions(@CurrentUser() user: User) {
        return this.menstrualPredictionsService.getPredictionsForUser(user.id);
    }
}
