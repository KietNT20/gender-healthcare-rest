import { Injectable } from '@nestjs/common';
import { CreatePackageServiceDto } from './dto/create-package-service.dto';
import { UpdatePackageServiceDto } from './dto/update-package-service.dto';

@Injectable()
export class PackageServicesService {
    create(createPackageServiceDto: CreatePackageServiceDto) {
        return 'This action adds a new packageService';
    }

    findAll() {
        return `This action returns all packageServices`;
    }

    findOne(id: number) {
        return `This action returns a #${id} packageService`;
    }

    update(id: number, updatePackageServiceDto: UpdatePackageServiceDto) {
        return `This action updates a #${id} packageService`;
    }

    remove(id: number) {
        return `This action removes a #${id} packageService`;
    }
}
