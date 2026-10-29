import { useBoard } from '../hooks/useBoard';
import WaitingRoom from './WaitingRoom';

interface Props {
    onStaffLogin: () => void;
}

/** Pantalla de la sala de espera sin iniciar sesión (para el monitor de la clínica). */
export default function PublicWaitingRoom({ onStaffLogin }: Props) {
    const { tickets, loading, error } = useBoard();

    return (
        <main className="min-h-screen bg-slate-100 p-4 md:p-8 space-y-4">
            {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}
            {/* Se monta con los datos ya cargados para que no suenen llamados antiguos */}
            {loading ? <p className="text-center text-slate-500">Cargando…</p> : <WaitingRoom tickets={tickets} />}
            <p className="text-center text-sm text-slate-500">
                <button onClick={onStaffLogin} className="underline hover:text-teal-700">
                    Acceso del personal
                </button>
            </p>
        </main>
    );
}