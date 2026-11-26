import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { useQueue } from './hooks/useQueue';
import TicketForm from './components/TicketForm';
import VetPanel from './components/VetPanel';
import TicketList from './components/TicketList';
import WaitingRoom from './components/WaitingRoom';
import PublicWaitingRoom from './components/PublicWaitingRoom.tsx';
import Employees from './components/Employees';
import { isFirebaseConfigured } from './lib/firebase';
import { useAuth } from './hooks/useAuth';
import { useEmployeeStatus } from './hooks/useEmployeeStatus';
import Login from './components/Login';
import type { View } from './components/SideBar.tsx';
import Sidebar from './components/SideBar.tsx';

const getViewFromHash = (): View => {
  if (window.location.hash === '#sala') return 'sala';
  if (window.location.hash === '#empleados') return 'empleados';
  return 'recepcion';
};

const PAGE_INFO: Record<View, { title: string; subtitle: string }> = {
  recepcion: {
    title: 'Recepción',
    subtitle: 'Registra pacientes y gestiona la atención de cada veterinario.',
  },
  sala: {
    title: 'Sala de espera',
    subtitle: 'Así verán los clientes la cola en el monitor de la sala.',
  },
  empleados: {
    title: 'Empleados',
    subtitle: 'Gestiona las cuentas del personal de la clínica.',
  },
};

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center text-slate-600">
      <div className="max-w-md space-y-3">{children}</div>
    </main>
  );
}

interface AuthedAppProps {
  user: User;
  view: View;
  onChangeView: (view: View) => void;
  onSignOut: () => Promise<void>;
  isAdmin: boolean;
  createEmployeeAccount: (email: string, displayName: string, rut: string | null) => Promise<unknown>;
  ensureEmployeeProfile: (user: User, role: 'admin' | 'employee') => Promise<void>;
}

/** App para el personal: solo se monta con sesión iniciada. */
function AuthedApp({ user, view, onChangeView, onSignOut, isAdmin, createEmployeeAccount, ensureEmployeeProfile }: AuthedAppProps) {
  const { tickets, loading, error, addTicket, callNext, complete, cancel } = useQueue();
  const blockedMessage = useEmployeeStatus(user, onSignOut);

  useEffect(() => {
    if (isAdmin) {
      void ensureEmployeeProfile(user, 'admin');
    }
  }, [isAdmin, user, ensureEmployeeProfile]);

  const stats = useMemo(
    () => ({
      waiting: tickets.filter((t) => t.status === 'Esperando').length,
      inAttention: tickets.filter((t) => t.status === 'Recibido').length,
      done: tickets.filter((t) => t.status === 'Completado').length,
    }),
    [tickets],
  );

  const { title, subtitle } = PAGE_INFO[view];

  return (
    <div className="bg-slate-100 text-slate-800 font-sans min-h-screen flex flex-col lg:flex-row">
      <Sidebar
        view={view}
        onChange={onChangeView}
        stats={stats}
        userEmail={user.displayName || user.email || 'Sesión iniciada'}
        onSignOut={onSignOut}
        isAdmin={isAdmin}
      />

      <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-teal-800">{title}</h1>
            <p className="text-slate-600">{subtitle}</p>
          </div>
          <p className="text-sm text-slate-500 capitalize">
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Cargando turnos…</p>
        ) : view === 'recepcion' ? (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
            <div className="xl:col-span-2">
              <TicketForm onSubmit={addTicket} />
            </div>
            <div className="xl:col-span-3 space-y-8">
              <VetPanel
                tickets={tickets}
                onCallNext={callNext}
                onComplete={complete}
                onCancel={cancel}
              />
              <TicketList tickets={tickets} onCancel={cancel} />
            </div>
          </div>
        ) : view === 'empleados' ? (
          <Employees
            user={user}
            isAdmin={isAdmin}
            createEmployeeAccount={createEmployeeAccount}
          />
        ) : (
          <WaitingRoom tickets={tickets} />
        )}
      </main>

      {blockedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-3 text-center">
            <p role="alert" className="text-red-600 font-semibold">{blockedMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function VetApp() {
  const { user, loading, isAdmin, signIn, createEmployeeAccount, ensureEmployeeProfile, signOut } = useAuth();
  const [view, setView] = useState<View>(getViewFromHash);

  // Permite abrir una vista directo con /#sala (por ejemplo en otro monitor)
  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const changeView = (next: View) => {
    window.location.hash = next;
    setView(next);
  };

  if (!isFirebaseConfigured) {
    return (
      <CenteredMessage>
        <p className="text-4xl">🐾</p>
        <h1 className="text-2xl font-extrabold text-teal-800">Falta configurar Firebase</h1>
        <p>
          Crea el archivo <code className="font-mono">.env</code> en la raíz del proyecto con
          las variables que aparecen en <code className="font-mono">env.example</code>, y reinicia{' '}
          <code className="font-mono">npm run dev</code>.
        </p>
      </CenteredMessage>
    );
  }

  if (loading) return <CenteredMessage>Cargando…</CenteredMessage>;

  if (!user) {
    return view === 'sala' ? (
      <PublicWaitingRoom onStaffLogin={() => changeView('recepcion')} />
    ) : (
      <Login onSignIn={signIn} onShowWaitingRoom={() => changeView('sala')} />
    );
  }

  return (
    <AuthedApp
      user={user}
      view={view}
      onChangeView={changeView}
      onSignOut={async () => { await signOut(); }}
      isAdmin={isAdmin}
      createEmployeeAccount={createEmployeeAccount}
      ensureEmployeeProfile={ensureEmployeeProfile}
    />
  );
}

export default VetApp;
