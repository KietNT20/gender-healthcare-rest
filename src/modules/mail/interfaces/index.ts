export interface SendAppointmentConfirmation {
    userName: string;
    consultantName: string;
    appointmentDate: string;
    appointmentTime: string;
    meetingLink?: string;
    serviceName: string;
    appointmentLocation: string;
}

export interface SendAppointmentReminder {
    userName: string;
    consultantName: string;
    appointmentDate: string;
    appointmentTime: string;
    meetingLink?: string;
    serviceName: string;
}

export interface SendAppointmentCancellation {
    recipientName: string;
    appointmentTime: string;
    cancellerName: string;
    cancellationReason: string;
}

export interface SendContraceptiveReminder {
    userName: string;
    contraceptiveType: string;
    reminderMessage?: string;
}

export interface SendMenstrualCycleReminder {
    userName: string;
}

export interface MenstrualCycleDetails {
    userName: string;
    menstrualCycleType: 'ovulation' | 'period_start' | 'fertile_window';
    predictedDate: string;
}

export interface TestResultDetails {
    userName: string;
    testType: string;
    resultDate: string;
    isAbnormal: boolean;
    recommendation?: string;
}
