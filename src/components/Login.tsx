import { useState } from 'react';
import { FirebaseError } from 'firebase/app';

interface Props {
    onSignIn: (email: string, password: string) => Promise<void>;
    onShowWaitingRoom: () => void;
}

const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

function messageFor(error: unknown): string {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
            case 'auth/invalid-email':
                return 'Correo o contraseña incorrectos.';
            case 'auth/too-many-requests':
                return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
            case 'auth/network-request-failed':
                return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
        }
    }
    return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export default function Login({ onSignIn, onShowWaitingRoom }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await onSignIn(email.trim(), password);
        } catch (err) {
            console.log("Error original de firebase: ", err)
            setError(messageFor(err));
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <header className="text-center space-y-1">
                    <p className="text-5xl" aria-hidden="true">🐾</p>
                    <h1 className="text-3xl font-extrabold tracking-tight text-teal-800">VetQueue</h1>
                    <p className="text-slate-600">Acceso del personal</p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4"
                >
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Correo
                        </label>
                        <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
                    >
                        {submitting ? 'Ingresando…' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    <button onClick={onShowWaitingRoom} className="underline hover:text-teal-700">
                        Ver pantalla de la sala de espera
                    </button>
                </p>
            </div>
        </main>
    );
}