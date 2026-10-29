import type { Ticket } from '../types/queue';
import { VETERINARIANS } from '../data/Veterinarians';
import { minutesSince, useNow } from '../hooks/useNow';

interface Props {
    tickets: Ticket[];
    onCallNext: (vetId: string) => void;
    onComplete: (ticketId: string) => void;
    onCancel: (ticketId: string) => void;
}

export default function VetPanel({ tickets, onCallNext, onComplete, onCancel }: Props) {
    const now = useNow();

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-3 border-slate-100">
                Veterinarios
            </h2>

            <div className="grid gap-4">
                {VETERINARIANS.map((vet) => {
                    const current = tickets.find((t) => t.status === 'Recibido' && t.vetId === vet.id);
                    const eligible = tickets.filter(
                        (t) =>
                            t.status === 'Esperando' &&
                            (t.preferredVetId === null || t.preferredVetId === vet.id),
                    ).length;

                    return (
                        <article
                            key={vet.id}
                            className={`rounded-xl border p-4 space-y-3 ${current ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-800">{vet.name}</h3>
                                    <p className="text-sm text-slate-500">
                                        {vet.room} · {vet.specialty}
                                    </p>
                                </div>
                                <span
                                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${current
                                            ? 'bg-amber-200 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                >
                                    {current ? 'Atendiendo' : 'Disponible'}
                                </span>
                            </div>

                            {current ? (
                                <>
                                    <div className="text-sm text-slate-700">
                                        <span className="font-extrabold text-teal-700">
                                            {current.ticketNumber}
                                        </span>{' '}
                                        · {current.petName} ({current.species}) · Dueño:{' '}
                                        {current.ownerName}
                                        <p className="text-slate-500">
                                            {current.reason}
                                            {current.calledAt &&
                                                ` · hace ${minutesSince(current.calledAt, now)} min`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onComplete(current.id)}
                                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition"
                                        >
                                            Finalizar atención
                                        </button>
                                        <button
                                            onClick={() => onCancel(current.id)}
                                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => onCallNext(vet.id)}
                                    disabled={eligible === 0}
                                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
                                >
                                    {eligible === 0
                                        ? 'Sin pacientes en espera'
                                        : `Llamar siguiente (${eligible} en espera)`}
                                </button>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}