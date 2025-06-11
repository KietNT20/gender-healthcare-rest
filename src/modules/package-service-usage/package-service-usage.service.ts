import { Injectable } from '@nestjs/common';
import { CreatePackageServiceUsageDto } from './dto/create-package-service-usage.dto';
import { UpdatePackageServiceUsageDto } from './dto/update-package-service-usage.dto';

@Injectable()
export class PackageServiceUsageService {
    create(createPackageServiceUsageDto: CreatePackageServiceUsageDto) {
        return 'This action adds a new packageServiceUsage';
    }

    findAll() {
        return `This action returns all packageServiceUsage`;
    }

    findOne(id: number) {
        return `This action returns a #${id} packageServiceUsage`;
    }

    update(
        id: number,
        updatePackageServiceUsageDto: UpdatePackageServiceUsageDto,
    ) {
        return `This action updates a #${id} packageServiceUsage`;
    }

    remove(id: number) {
        return `This action removes a #${id} packageServiceUsage`;
    }
}
