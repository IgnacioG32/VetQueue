import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NewTicketData, Ticket } from '../types/queue';

const STORAGE_KEY = 'vetqueue:v1';

interface QueueState {
    tickets: Ticket[]; // historial completo
    counter: number; // correlativo del día
    day: string; // YYYY-MM-DD del correlativo
}

const dayKey = (d: Date = new Date()) => d.toLocaleDateString('en-CA');

const reviveDate = (value: unknown): Date | null =>
    typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;

const reviveTicket = (raw: Ticket): Ticket => ({
    ...raw,
    createdAt: reviveDate(raw.createdAt) ?? new Date(),
    calledAt: reviveDate(raw.calledAt),
    completedAt: reviveDate(raw.completedAt),
});

function load(): QueueState {
    const today = dayKey();
    const empty: QueueState = { tickets: [], counter: 1, day: today };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return empty;
        const parsed = JSON.parse(raw) as Partial<QueueState>;
        return {
            tickets: (parsed.tickets ?? []).map(reviveTicket),
            // El correlativo VET-01, VET-02... se reinicia cada día
            counter: parsed.day === today ? (parsed.counter ?? 1) : 1,
            day: today,
        };
    } catch {
        return empty;
    }
}

/**
 * Cola de turnos persistida en localStorage.
 * Se sincroniza entre pestañas: la pantalla de sala de espera
 * puede estar abierta en otro monitor y se actualiza sola.
 */
export function useQueue() {
    const [state, setState] = useState<QueueState>(load);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY || e.key === null) setState(load());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Siempre parte desde lo último guardado para no pisar cambios de otra pestaña
    const update = useCallback((fn: (s: QueueState) => QueueState) => {
        const next = fn(load());
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // almacenamiento lleno o bloqueado: seguimos solo en memoria
        }
        setState(next);
    }, []);

    const addTicket = useCallback(
        (data: NewTicketData): Ticket => {
            let created!: Ticket;
            update((s) => {
                created = {
                    id: crypto.randomUUID(),
                    ticketNumber: `VET-${String(s.counter).padStart(2, '0')}`,
                    ...data,
                    vetId: null,
                    status: 'Esperando',
                    createdAt: new Date(),
                    calledAt: null,
                    completedAt: null,
                };
                return { ...s, tickets: [...s.tickets, created], counter: s.counter + 1 };
            });
            return created;
        },
        [update],
    );

    /** Llama al siguiente paciente elegible (el más antiguo que no pidió a otro veterinario). */
    const callNext = useCallback(
        (vetId: string) => {
            update((s) => {
                const busy = s.tickets.some((t) => t.status === 'Recibido' && t.vetId === vetId);
                if (busy) return s;
                const next = s.tickets.find(
                    (t) =>
                        t.status === 'Esperando' &&
                        (t.preferredVetId === null || t.preferredVetId === vetId),
                );
                if (!next) return s;
                return {
                    ...s,
                    tickets: s.tickets.map((t) =>
                        t.id === next.id
                            ? { ...t, status: 'Recibido' as const, vetId, calledAt: new Date() }
                            : t,
                    ),
                };
            });
        },
        [update],
    );

    const complete = useCallback(
        (ticketId: string) => {
            update((s) => ({
                ...s,
                tickets: s.tickets.map((t) =>
                    t.id === ticketId && t.status === 'Recibido'
                        ? { ...t, status: 'Completado' as const, completedAt: new Date() }
                        : t,
                ),
            }));
        },
        [update],
    );

    const cancel = useCallback(
        (ticketId: string) => {
            update((s) => ({
                ...s,
                tickets: s.tickets.map((t) =>
                    t.id === ticketId && (t.status === 'Esperando' || t.status === 'Recibido')
                        ? { ...t, status: 'Cancelado' as const, completedAt: new Date() }
                        : t,
                ),
            }));
        },
        [update],
    );

    // Solo los turnos de hoy se muestran; el historial queda guardado
    const tickets = useMemo(() => {
        const today = dayKey();
        return state.tickets.filter((t) => dayKey(t.createdAt) === today);
    }, [state.tickets]);

    return { tickets, addTicket, callNext, complete, cancel };
}