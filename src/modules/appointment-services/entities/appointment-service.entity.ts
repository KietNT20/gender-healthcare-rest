import { Appointment } from '@modules/appointments/entities/appointment.entity';
import { Service } from '@modules/services/entities/service.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('appointment_services')
export class AppointmentService {
  @PrimaryColumn({ name: 'appointment_id' })
  appointmentId: string;

  @PrimaryColumn({ name: 'service_id' })
  serviceId: string;

  // Relations
  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
