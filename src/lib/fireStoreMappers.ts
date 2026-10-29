import { Timestamp, type DocumentData } from 'firebase/firestore';
import type { PublicTicket, Species, Ticket, TicketStatus } from '../types/queue';

export const toDate = (value: unknown): Date | null =>
    value instanceof Timestamp ? value.toDate() : null;

/** Ficha completa (colección `tickets`, solo personal). */
export function toTicket(id: string, x: DocumentData): Ticket {
    return {
        id,
        ticketNumber: String(x.ticketNumber ?? ''),
        ownerRut: String(x.ownerRut ?? ''),
        ownerName: String(x.ownerName ?? ''),
        ownerPhone: String(x.ownerPhone ?? ''),
        petName: String(x.petName ?? ''),
        species: (x.species ?? 'Otro') as Species,
        reason: String(x.reason ?? ''),
        preferredVetId: (x.preferredVetId ?? null) as string | null,
        vetId: (x.vetId ?? null) as string | null,
        status: (x.status ?? 'Esperando') as TicketStatus,
        createdAt: toDate(x.createdAt) ?? new Date(),
        calledAt: toDate(x.calledAt),
        completedAt: toDate(x.completedAt),
    };
}

/** Datos públicos para la sala de espera (colección `board`, sin datos del dueño). */
export function toPublicTicket(id: string, x: DocumentData): PublicTicket {
    return {
        id,
        ticketNumber: String(x.ticketNumber ?? ''),
        petName: String(x.petName ?? ''),
        status: (x.status ?? 'Esperando') as TicketStatus,
        preferredVetId: (x.preferredVetId ?? null) as string | null,
        vetId: (x.vetId ?? null) as string | null,
        createdAt: toDate(x.createdAt) ?? new Date(),
        calledAt: toDate(x.calledAt),
    };
}

export const byCreatedAt = <T extends { createdAt: Date; ticketNumber: string }>(a: T, b: T) =>
    a.createdAt.getTime() - b.createdAt.getTime() || a.ticketNumber.localeCompare(b.ticketNumber);