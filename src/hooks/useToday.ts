import { useEffect, useState } from 'react';

/** Fecha local en formato YYYY-MM-DD, usada para agrupar los turnos por día. */
export const dayKey = (d: Date = new Date()): string => d.toLocaleDateString('en-CA');

/** Devuelve el día actual y se actualiza solo si la app queda abierta pasada la medianoche. */
export function useToday(): string {
    const [day, setDay] = useState(() => dayKey());
    useEffect(() => {
        const id = window.setInterval(() => setDay(dayKey()), 60_000);
        return () => window.clearInterval(id);
    }, []);
    return day;
}