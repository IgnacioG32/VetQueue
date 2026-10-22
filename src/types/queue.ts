
export type TicketStatus = 'Esperando' | 'Recibido' | 'Completado' | 'Cancelado';

export interface Ticket {
    id: string;
    ticketNumber: string;
    ownerRut: string;
    petName: string;
    status: TicketStatus;
    createdAt: Date;
}