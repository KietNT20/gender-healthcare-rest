import { Injectable } from '@nestjs/common';
import { CreateConsultantAvailabilityDto } from './dto/create-consultant-availability.dto';
import { UpdateConsultantAvailabilityDto } from './dto/update-consultant-availability.dto';

@Injectable()
export class ConsultantAvailabilityService {
  create(createConsultantAvailabilityDto: CreateConsultantAvailabilityDto) {
    return 'This action adds a new consultantAvailability';
  }

  findAll() {
    return `This action returns all consultantAvailability`;
  }

  findOne(id: number) {
    return `This action returns a #${id} consultantAvailability`;
  }

  update(id: number, updateConsultantAvailabilityDto: UpdateConsultantAvailabilityDto) {
    return `This action updates a #${id} consultantAvailability`;
  }

  remove(id: number) {
    return `This action removes a #${id} consultantAvailability`;
  }
}
