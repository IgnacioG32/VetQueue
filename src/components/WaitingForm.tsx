import type { Ticket } from '../types/queue';
import { useNow } from '../hooks/useNow';
import { VETERINARIANS, getVet } from '../data/Veterinarians';

interface Props {
    tickets: Ticket[];
}

const MAX_VISIBLE = 8;

/** Pantalla para el monitor de la sala de espera. No muestra RUT ni datos del dueño. */
export default function WaitingRoom({ tickets }: Props) {
    const now = useNow(10_000);
    const waiting = tickets.filter((t) => t.status === 'Esperando');

    return (
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-10 space-y-8 min-h-[70vh]">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-4xl font-extrabold">Ahora atendiendo</h2>
                <p className="text-2xl md:text-4xl font-mono text-teal-300">
                    {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {VETERINARIANS.map((vet) => {
                    const current = tickets.find((t) => t.status === 'Recibido' && t.vetId === vet.id);
                    return (
                        <div
                            key={vet.id}
                            className={`rounded-2xl p-5 text-center space-y-2 ${current ? 'bg-teal-600' : 'bg-slate-800'
                                }`}
                        >
                            <p className="text-sm uppercase tracking-widest text-white/70">
                                {vet.room}
                            </p>
                            <p className="text-lg font-semibold">{vet.name}</p>
                            {current ? (
                                <>
                                    <p className="text-5xl md:text-6xl font-extrabold tracking-wide">
                                        {current.ticketNumber}
                                    </p>
                                    <p className="text-xl">{current.petName}</p>
                                </>
                            ) : (
                                <p className="text-2xl font-semibold text-emerald-300 py-4">
                                    Disponible
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div>
                <h3 className="text-xl md:text-2xl font-bold mb-3">
                    En espera{' '}
                    <span className="text-slate-400 font-medium">({waiting.length})</span>
                </h3>

                {waiting.length === 0 ? (
                    <p className="text-slate-400 text-lg">No hay pacientes en espera.</p>
                ) : (
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {waiting.slice(0, MAX_VISIBLE).map((t, i) => {
                            const preferred = getVet(t.preferredVetId);
                            return (
                                <li
                                    key={t.id}
                                    className="flex items-center gap-4 bg-slate-800 rounded-xl px-4 py-3"
                                >
                                    <span className="text-slate-400 font-bold w-6">{i + 1}</span>
                                    <span className="text-2xl font-extrabold text-teal-300">
                                        {t.ticketNumber}
                                    </span>
                                    <span className="flex-1 text-lg truncate">{t.petName}</span>
                                    {preferred && (
                                        <span className="text-sm text-slate-300">
                                            con {preferred.name}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                )}
                {waiting.length > MAX_VISIBLE && (
                    <p className="mt-3 text-slate-400">
                        y {waiting.length - MAX_VISIBLE} más en espera…
                    </p>
                )}
            </div>
        </div>
    );
}