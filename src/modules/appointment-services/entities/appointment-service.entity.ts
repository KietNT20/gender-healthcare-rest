import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('appointment_services')
@Index('appointment_services_pkey', ['appointmentId', 'serviceId'])
export class AppointmentService {
  @PrimaryColumn({ name: 'appointment_id' })
  @Index('idx_appointment_services_appointment_id')
  appointmentId: string;

  @PrimaryColumn({ name: 'service_id' })
  @Index('idx_appointment_services_service_id')
  serviceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(
    () => Appointment,
    (appointment) => appointment.appointmentServices,
  )
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Service, (service) => service.appointmentServices)
  @JoinColumn({ name: 'service_id' })
  service: Service;
}
