import { useEffect, useState } from 'react';

/** Devuelve la hora actual y se refresca cada `intervalMs`. */
export function useNow(intervalMs = 30_000): Date {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), intervalMs);
        return () => window.clearInterval(id);
    }, [intervalMs]);
    return now;
}

export const minutesSince = (from: Date, now: Date): number =>
    Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000));