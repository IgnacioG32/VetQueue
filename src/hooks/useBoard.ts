import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PublicTicket } from '../types/queue';
import { useToday } from './useToday';
import { toPublicTicket, byCreatedAt } from '../lib/fireStoreMappers';

/**
 * Turnos de hoy para la pantalla de la sala de espera.
 * Lee la colección pública `board`: no incluye RUT ni datos del dueño,
 * por eso no requiere iniciar sesión.
 */
export function useBoard() {
    const day = useToday();
    const [tickets, setTickets] = useState<PublicTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'board'), where('day', '==', day));
        return onSnapshot(
            q,
            (snapshot) => {
                setTickets(
                    snapshot.docs
                        .map((d) => toPublicTicket(d.id, d.data({ serverTimestamps: 'estimate' })))
                        .sort(byCreatedAt),
                );
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(err);
                setLoading(false);
                setError('No se pudo conectar con la base de datos.');
            },
        );
    }, [day]);

    return { tickets, loading, error };
}