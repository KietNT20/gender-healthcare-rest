import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { IsNull, In } from 'typeorm';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const { userId, consultantId, services, ...appointmentData } = createAppointmentDto;

    // Kiểm tra người dùng và cố vấn
    const user = await this.userRepository.findOne({ where: { id: userId, deletedAt: IsNull() } });
    const consultant = await this.userRepository.findOne({ where: { id: consultantId, deletedAt: IsNull() } });
    if (!user || !consultant) {
      throw new NotFoundException('User or consultant not found');
    }

    // Kiểm tra dịch vụ
    let serviceEntities: Service[] = [];
    if (services && services.length > 0) {
      serviceEntities = await this.serviceRepository.findBy({ id: In(services), deletedAt: IsNull(), isActive: true });
      if (serviceEntities.length !== services.length) {
        throw new NotFoundException('One or more services not found or inactive');
      }
    }

    const appointment = this.appointmentRepository.create({
      ...appointmentData,
      user: { id: userId },
      consultant: { id: consultantId },
      services: serviceEntities,
    });

    return await this.appointmentRepository.save(appointment);
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['user', 'consultant', 'services', 'payments'],
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user', 'consultant', 'services', 'payments'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID '${id}' not found`);
    }
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return await this.appointmentRepository.save(appointment);
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.softDelete(id);
  }

  async calculateTotalPrice(id: string): Promise<number> {
    const appointment = await this.findOne(id);
    if (!appointment.services || appointment.services.length === 0) {
      return appointment.fixedPrice || 0;
    }
    return appointment.services.reduce((total, service) => total + service.price, 0) || appointment.fixedPrice || 0;
  }
}