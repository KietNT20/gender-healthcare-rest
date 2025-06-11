import { Injectable } from '@nestjs/common';
import { CreateConsultantProfileDto } from './dto/create-consultant-profile.dto';
import { UpdateConsultantProfileDto } from './dto/update-consultant-profile.dto';

@Injectable()
export class ConsultantProfilesService {
  create(createConsultantProfileDto: CreateConsultantProfileDto) {
    return 'This action adds a new consultantProfile';
  }

  findAll() {
    return `This action returns all consultantProfiles`;
  }

  findOne(id: number) {
    return `This action returns a #${id} consultantProfile`;
  }

  update(id: number, updateConsultantProfileDto: UpdateConsultantProfileDto) {
    return `This action updates a #${id} consultantProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} consultantProfile`;
  }
}
