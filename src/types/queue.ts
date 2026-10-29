export type TicketStatus = 'Esperando' | 'Recibido' | 'Completado' | 'Cancelado';

export type Species = 'Perro' | 'Gato' | 'Ave' | 'Conejo' | 'Otro';

export interface Veterinarian {
    id: string;
    name: string;
    specialty: string;
    room: string;
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    // Dueño
    ownerRut: string;
    ownerName: string;
    ownerPhone: string;
    // Mascota
    petName: string;
    species: Species;
    reason: string;
    // Asignación
    preferredVetId: string | null; // veterinario que pidió el cliente (opcional)
    vetId: string | null; // veterinario que realmente atiende
    status: TicketStatus;
    createdAt: Date;
    calledAt: Date | null;
    completedAt: Date | null;
}

/** Lo que muestra la pantalla pública de la sala: sin RUT ni datos del dueño. */
export type PublicTicket = Pick<
    Ticket,
    'id' | 'ticketNumber' | 'petName' | 'status' | 'preferredVetId' | 'vetId' | 'createdAt' | 'calledAt'
>;

export type NewTicketData = Pick<
    Ticket,
    'ownerRut' | 'ownerName' | 'ownerPhone' | 'petName' | 'species' | 'reason' | 'preferredVetId'
>;