import { useEffect, useRef, useState } from 'react';
import type { PublicTicket } from '../types/queue';
import { minutesSince, useNow } from '../hooks/useNow';
import { useCallSound } from '../hooks/useCallSound';
import { getVet, VETERINARIANS } from '../data/Veterinarians';

interface Props {
    tickets: PublicTicket[];
}

const MAX_VISIBLE = 8;
const RECENT_CALL_MS = 90_000; // cuánto tiempo se destaca el último llamado

const initials = (name: string) =>
    name
        .replace(/^Dra?\.\s*/, '')
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

/** Pantalla para el monitor de la sala de espera. No muestra RUT ni datos del dueño. */
export default function WaitingRoom({ tickets }: Props) {
    const now = useNow(1_000); // 1 s para que el reloj muestre los segundos
    const rootRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // Sonido: se anuncia cada llamado nuevo. Al abrir la vista se registran los
    // llamados que ya existían para que no suenen de golpe.
    const { enabled: soundOn, toggle: toggleSound, announce } = useCallSound();
    const seenCalls = useRef<Set<string> | null>(null);

    useEffect(() => {
        const calls = tickets
            .filter((t) => t.status === 'Recibido' && t.calledAt)
            .map((t) => ({ ticket: t, key: `${t.id}@${t.calledAt!.getTime()}` }));

        if (seenCalls.current === null) {
            seenCalls.current = new Set(calls.map((c) => c.key));
            return;
        }

        for (const { ticket, key } of calls) {
            if (seenCalls.current.has(key)) continue;
            seenCalls.current.add(key);
            const room = getVet(ticket.vetId)?.room ?? 'consulta';
            announce(
                `Turno ${ticket.ticketNumber.replace('-', ' ')}. ${ticket.petName}, pase a ${room}.`,
            );
        }
    }, [tickets, announce]);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void rootRef.current?.requestFullscreen();
    };

    const waiting = tickets.filter((t) => t.status === 'Esperando');

    // Último paciente llamado en el último minuto y medio
    const recentCall = tickets
        .filter(
            (t) =>
                t.status === 'Recibido' &&
                t.calledAt &&
                now.getTime() - t.calledAt.getTime() < RECENT_CALL_MS,
        )
        .sort((a, b) => b.calledAt!.getTime() - a.calledAt!.getTime())[0];
    const recentVet = getVet(recentCall?.vetId ?? null);

    return (
        <div
            ref={rootRef}
            className={`bg-slate-900 text-white flex flex-col gap-6 ${isFullscreen
                ? 'min-h-screen p-8 md:p-12 overflow-auto'
                : 'rounded-3xl p-6 md:p-8 min-h-[75vh]'
                }`}
        >
            {/* Encabezado */}
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-4xl" aria-hidden="true">🐾</span>
                    <div className="leading-tight">
                        <p className="text-2xl md:text-3xl font-extrabold">Sala de espera</p>
                        <p className="text-sm text-slate-400">Atento a su número de turno</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right leading-tight">
                        <p className="text-3xl md:text-5xl font-mono font-bold text-teal-300">
                            {now.toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </p>
                        <p className="text-sm text-slate-400 capitalize">
                            {now.toLocaleDateString('es-CL', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </p>
                    </div>
                    <button
                        onClick={toggleSound}
                        aria-pressed={soundOn}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${soundOn
                            ? 'border-teal-400 bg-teal-600 text-white'
                            : 'border-white/20 text-slate-200 hover:bg-white/10'
                            }`}
                    >
                        {soundOn ? '🔔 Sonido activado' : '🔕 Activar sonido'}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                        {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    </button>
                </div>
            </header>

            {/* Aviso del último llamado */}
            {recentCall && (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-2xl bg-amber-400 text-slate-900 px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-1 animate-pulse"
                >
                    <span className="text-xs font-bold uppercase tracking-widest">Llamando</span>
                    <span className="text-4xl md:text-5xl font-extrabold">
                        {recentCall.ticketNumber}
                    </span>
                    <span className="text-xl md:text-2xl font-semibold">
                        {recentCall.petName}, pase a {recentVet?.room ?? 'consulta'}
                        {recentVet && ` · ${recentVet.name}`}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
                {/* Ahora atendiendo */}
                <section className="xl:col-span-2 space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                        Ahora atendiendo
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
                        {VETERINARIANS.map((vet) => {
                            const current = tickets.find(
                                (t) => t.status === 'Recibido' && t.vetId === vet.id,
                            );
                            return (
                                <article
                                    key={vet.id}
                                    className={`rounded-2xl p-5 flex flex-col gap-4 border ${current
                                        ? 'bg-teal-600 border-teal-400'
                                        : 'bg-slate-800 border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${current ? 'bg-white/20' : 'bg-slate-700'
                                                }`}
                                            aria-hidden="true"
                                        >
                                            {initials(vet.name)}
                                        </span>
                                        <div className="leading-tight min-w-0">
                                            <p className="font-semibold truncate">{vet.name}</p>
                                            <p
                                                className={`text-sm truncate ${current ? 'text-teal-100' : 'text-slate-400'
                                                    }`}
                                            >
                                                {vet.specialty}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between gap-3">
                                        <span className="text-sm font-bold uppercase tracking-widest bg-black/20 rounded-lg px-2.5 py-1">
                                            {vet.room}
                                        </span>
                                        {current ? (
                                            <div className="text-right leading-tight">
                                                <p className="text-5xl font-extrabold tracking-wide">
                                                    {current.ticketNumber}
                                                </p>
                                                <p className="text-lg mt-1">{current.petName}</p>
                                            </div>
                                        ) : (
                                            <p className="flex items-center gap-2 text-lg font-semibold text-emerald-300">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                                Disponible
                                            </p>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* Próximos turnos */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                        Próximos turnos{' '}
                        <span className="text-slate-500">({waiting.length})</span>
                    </h2>

                    {waiting.length === 0 ? (
                        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 text-center text-slate-400">
                            No hay pacientes en espera.
                        </div>
                    ) : (
                        <ol className="space-y-2">
                            {waiting.slice(0, MAX_VISIBLE).map((t, i) => {
                                const preferred = getVet(t.preferredVetId);
                                return (
                                    <li
                                        key={t.id}
                                        className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${i === 0
                                            ? 'bg-slate-700 border-teal-400'
                                            : 'bg-slate-800 border-slate-700'
                                            }`}
                                    >
                                        <span className="text-3xl font-extrabold text-teal-300 w-24 shrink-0">
                                            {t.ticketNumber}
                                        </span>
                                        <div className="flex-1 min-w-0 leading-tight">
                                            <p className="text-lg truncate">{t.petName}</p>
                                            <p className="text-xs text-slate-400 truncate">
                                                {i === 0 ? 'Siguiente · ' : ''}
                                                {minutesSince(t.createdAt, now)} min de espera
                                                {preferred && ` · ${preferred.name}`}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    {waiting.length > MAX_VISIBLE && (
                        <p className="text-slate-400 text-sm">
                            y {waiting.length - MAX_VISIBLE} más en espera…
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}