import type { Ticket, TicketStatus } from '../types/queue';
import { minutesSince, useNow } from '../hooks/useNow';
import { getVet } from '../data/Veterinarians';

const STATUS_STYLES: Record<TicketStatus, string> = {
    Esperando: 'bg-sky-100 text-sky-700',
    Recibido: 'bg-amber-100 text-amber-800',
    Completado: 'bg-emerald-100 text-emerald-700',
    Cancelado: 'bg-slate-200 text-slate-600',
};

interface Props {
    tickets: Ticket[];
    onCancel: (ticketId: string) => void;
}

const time = (d: Date) => d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

export default function TicketList({ tickets, onCancel }: Props) {
    const now = useNow();
    const waiting = tickets.filter((t) => t.status === 'Esperando');
    const finished = tickets
        .filter((t) => t.status === 'Completado' || t.status === 'Cancelado')
        .slice()
        .reverse();

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-3 border-slate-100">
                Cola de espera{' '}
                <span className="text-base font-medium text-slate-400">({waiting.length})</span>
            </h2>

            {waiting.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
                    No hay pacientes esperando.
                </p>
            ) : (
                <ol className="space-y-2">
                    {waiting.map((t, i) => {
                        const preferred = getVet(t.preferredVetId);
                        return (
                            <li
                                key={t.id}
                                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                            >
                                <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800">
                                        <span className="text-teal-700">{t.ticketNumber}</span> ·{' '}
                                        {t.petName}{' '}
                                        <span className="font-normal text-slate-500">
                                            ({t.species})
                                        </span>
                                    </p>
                                    <p className="text-sm text-slate-500 truncate">
                                        {t.ownerName} · {t.ownerRut} · {t.reason}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Espera: {minutesSince(t.createdAt, now)} min
                                        {preferred && ` · Prefiere a ${preferred.name}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onCancel(t.id)}
                                    className="text-sm text-slate-500 hover:text-red-600 px-2 py-1 transition"
                                >
                                    Cancelar
                                </button>
                            </li>
                        );
                    })}
                </ol>
            )}

            {finished.length > 0 && (
                <details className="pt-2">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-600">
                        Atenciones finalizadas hoy ({finished.length})
                    </summary>
                    <ul className="mt-3 space-y-2">
                        {finished.map((t) => (
                            <li
                                key={t.id}
                                className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 pb-2"
                            >
                                <span className="text-slate-700">
                                    <span className="font-bold">{t.ticketNumber}</span> · {t.petName}
                                    {getVet(t.vetId) && ` · ${getVet(t.vetId)!.name}`}
                                    {t.completedAt && ` · ${time(t.completedAt)}`}
                                </span>
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}
                                >
                                    {t.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </section>
    );
}