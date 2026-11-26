import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { NewTicketData, Ticket } from '../types/queue';
import { useToday, dayKey } from './useToday';
import { byCreatedAt, toTicket } from '../lib/fireStoreMappers';

const ACTION_ERROR = 'No se pudo completar la acción. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Cola de turnos en Firestore (solo personal con sesión iniciada).
 *
 * Cada turno se guarda en dos lugares:
 *  - `tickets/{id}`: ficha completa (dueño, RUT, teléfono...). Solo personal.
 *  - `board/{id}`: datos públicos para la pantalla de la sala (sin datos del dueño).
 */
export function useQueue() {
    const day = useToday();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Escucha en tiempo real los turnos de hoy
    useEffect(() => {
        const q = query(collection(db, 'tickets'), where('day', '==', day));
        return onSnapshot(
            q,
            (snapshot) => {
                setTickets(
                    snapshot.docs
                        .map((d) => toTicket(d.id, d.data({ serverTimestamps: 'estimate' })))
                        .sort(byCreatedAt),
                );
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(err);
                setLoading(false);
                setError(
                    'No se pudieron leer los turnos. Revisa tu conexión y las reglas de Firestore.',
                );
            },
        );
    }, [day]);

    const run = useCallback(async (action: () => Promise<void>) => {
        setError(null);
        try {
            await action();
        } catch (err) {
            console.error(err);
            setError(ACTION_ERROR);
        }
    }, []);

    /** Crea el turno con un correlativo diario que no se repite entre equipos (transacción). */
    const addTicket = useCallback(async (data: NewTicketData): Promise<Ticket> => {
        const today = dayKey();
        const ticketRef = doc(collection(db, 'tickets'));
        const boardRef = doc(db, 'board', ticketRef.id);
        const counterRef = doc(db, 'counters', today);

        const ticketNumber = await runTransaction(db, async (tx) => {
            const counterSnap = await tx.get(counterRef);
            const next = (counterSnap.exists() ? Number(counterSnap.data().value) : 0) + 1;
            const number = `VET-${String(next).padStart(2, '0')}`;

            tx.set(counterRef, { value: next });
            tx.set(ticketRef, {
                ...data,
                ticketNumber: number,
                day: today,
                vetId: null,
                status: 'Esperando',
                createdAt: serverTimestamp(),
                calledAt: null,
                completedAt: null,
            });
            tx.set(boardRef, {
                ticketNumber: number,
                petName: data.petName,
                day: today,
                preferredVetId: data.preferredVetId,
                vetId: null,
                status: 'Esperando',
                createdAt: serverTimestamp(),
                calledAt: null,
            });
            return number;
        });

        return {
            id: ticketRef.id,
            ticketNumber,
            ...data,
            vetId: null,
            status: 'Esperando',
            createdAt: new Date(),
            calledAt: null,
            completedAt: null,
        };
    }, []);

    /**
     * Llama al siguiente paciente elegible (el más antiguo que no pidió a otro veterinario).
     * La transacción confirma que nadie más lo tomó mientras tanto.
     */
    const callNext = useCallback(
        (vetId: string) =>
            run(async () => {
                if (tickets.some((t) => t.status === 'Recibido' && t.vetId === vetId)) return;

                const candidates = tickets
                    .filter(
                        (t) =>
                            t.status === 'Esperando' &&
                            (t.preferredVetId === null || t.preferredVetId === vetId),
                    )
                    .slice(0, 5);

                await runTransaction(db, async (tx) => {
                    for (const candidate of candidates) {
                        const ref = doc(db, 'tickets', candidate.id);
                        const snap = await tx.get(ref);
                        if (snap.exists() && snap.data().status === 'Esperando') {
                            tx.update(ref, {
                                status: 'Recibido',
                                vetId,
                                calledAt: serverTimestamp(),
                            });
                            tx.update(doc(db, 'board', candidate.id), {
                                status: 'Recibido',
                                vetId,
                                calledAt: serverTimestamp(),
                            });
                            return;
                        }
                    }
                });
            }),
        [run, tickets],
    );

    const finish = useCallback(
        (ticketId: string, status: 'Completado' | 'Cancelado') =>
            run(async () => {
                const batch = writeBatch(db);
                batch.update(doc(db, 'tickets', ticketId), {
                    status,
                    completedAt: serverTimestamp(),
                });
                batch.update(doc(db, 'board', ticketId), { status });
                await batch.commit();
            }),
        [run],
    );

    const complete = useCallback(
        (ticketId: string) => {
            if (tickets.find((t) => t.id === ticketId)?.status !== 'Recibido') return;
            void finish(ticketId, 'Completado');
        },
        [finish, tickets],
    );

    const cancel = useCallback(
        (ticketId: string) => {
            const status = tickets.find((t) => t.id === ticketId)?.status;
            if (status !== 'Esperando' && status !== 'Recibido') return;
            void finish(ticketId, 'Cancelado');
        },
        [finish, tickets],
    );

    return useMemo(
        () => ({ tickets, loading, error, addTicket, callNext, complete, cancel }),
        [tickets, loading, error, addTicket, callNext, complete, cancel],
    );
}