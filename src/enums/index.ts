export enum GenderType {
  MALE = 'M',
  FEMALE = 'F',
  OTHER = 'O',
}

export enum RolesNameEnum {
  CUSTOMER = 'customer',
  CONSULTANT = 'consultant',
  STAFF = 'staff',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum AppointmentStatusType {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
}

export enum ContentStatusType {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  NEEDS_REVISION = 'needs_revision',
  REJECTED = 'rejected',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContractStatusType {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

export enum LocationTypeEnum {
  ONLINE = 'online',
  OFFICE = 'office',
}

export enum PaymentStatusType {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PriorityType {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProfileStatusType {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  TRAINING = 'training',
  INACTIVE = 'inactive',
}

export enum QuestionStatusType {
  PENDING = 'pending',
  ANSWERED = 'answered',
  CLOSED = 'closed',
}

export enum ReminderFrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum ReminderStatusType {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum ServiceCategoryType {
  CONSULTATION = 'consultation',
  TEST = 'test',
  TREATMENT = 'treatment',
  PACKAGE = 'package',
}

export enum SubscriptionStatusType {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}
