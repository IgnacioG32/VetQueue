import type { ReactNode } from 'react';

export type View = 'recepcion' | 'sala';

interface Stats {
    waiting: number;
    inAttention: number;
    done: number;
}

interface Props {
    view: View;
    onChange: (view: View) => void;
    stats: Stats;
    userEmail: string;
    onSignOut: () => void;
}

const iconClass = 'w-5 h-5 shrink-0';

const ClipboardIcon = (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4.5h6M9.5 11h5M9.5 15h5" />
    </svg>
);

const TvIcon = (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8M12 17v4" />
    </svg>
);

const ExternalIcon = (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
);

const NAV: { id: View; label: string; icon: ReactNode }[] = [
    { id: 'recepcion', label: 'Recepción', icon: ClipboardIcon },
    { id: 'sala', label: 'Sala de espera', icon: TvIcon },
];

export default function Sidebar({ view, onChange, stats, userEmail, onSignOut }: Props) {
    const openInNewScreen = () => {
        window.open(`${window.location.pathname}#sala`, '_blank', 'noopener');
    };

    return (
        <aside className="bg-teal-900 text-white flex flex-col gap-4 p-4 lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:p-5">
            {/* Marca */}
            <div className="flex items-center gap-3 lg:pb-2">
                <span className="text-3xl" aria-hidden="true">🐾</span>
                <div className="leading-tight">
                    <p className="text-xl font-extrabold tracking-tight">VetQueue</p>
                    <p className="hidden lg:block text-xs text-teal-200">Gestión de turnos</p>
                </div>
            </div>

            {/* Navegación */}
            <nav aria-label="Vistas" className="flex gap-2 lg:flex-col">
                {NAV.map((item) => {
                    const active = view === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            aria-current={active ? 'page' : undefined}
                            className={`flex flex-1 lg:flex-none items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition ${active
                                    ? 'bg-white text-teal-900 shadow'
                                    : 'text-teal-100 hover:bg-white/10'
                                }`}
                        >
                            {item.icon}
                            <span className="flex-1">{item.label}</span>
                            {item.id === 'recepcion' && stats.waiting > 0 && (
                                <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-teal-600 text-white' : 'bg-white/20 text-white'
                                        }`}
                                    aria-label={`${stats.waiting} en espera`}
                                >
                                    {stats.waiting}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Resumen del día (solo escritorio) */}
            <div className="hidden lg:block mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">
                    Resumen de hoy
                </p>
                <dl className="grid grid-cols-3 gap-2 text-center">
                    {[
                        { label: 'En espera', value: stats.waiting },
                        { label: 'Atendiendo', value: stats.inAttention },
                        { label: 'Atendidos', value: stats.done },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-white/10 py-2.5 px-1">
                            <dd className="text-2xl font-extrabold leading-none">{s.value}</dd>
                            <dt className="text-[11px] text-teal-200 mt-1">{s.label}</dt>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Acceso rápido para el monitor de la sala */}
            <div className="hidden lg:block mt-auto">
                <button
                    onClick={openInNewScreen}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/25 px-3 py-2.5 text-sm font-semibold text-teal-50 hover:bg-white/10 transition"
                >
                    {ExternalIcon}
                    Abrir sala en otra pantalla
                </button>
                <p className="mt-2 text-[11px] leading-snug text-teal-300">
                    Úsalo en el monitor de la sala. Debe estar en este mismo computador para
                    actualizarse solo.
                </p>
            </div>

            {/* Sesión */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 text-sm">
                <span className="truncate text-teal-50" title={userEmail}>
                    {userEmail}
                </span>
                <button
                    onClick={onSignOut}
                    className="shrink-0 font-semibold text-teal-100 underline hover:text-white"
                >
                    Salir
                </button>
            </div>
        </aside>
    );
}