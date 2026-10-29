import { useEffect, useMemo, useState } from 'react';
import { useQueue } from './hooks/useQueue';
import TicketForm from './components/TicketForm';
import VetPanel from './components/VetPanel';
import TicketList from './components/TicketList';
import Sidebar, { type View } from './components/SideBar';
import WaitingRoom from './components/WaitingForm';

const getViewFromHash = (): View => (window.location.hash === '#sala' ? 'sala' : 'recepcion');

const PAGE_INFO: Record<View, { title: string; subtitle: string }> = {
  recepcion: {
    title: 'Recepción',
    subtitle: 'Registra pacientes y gestiona la atención de cada veterinario.',
  },
  sala: {
    title: 'Sala de espera',
    subtitle: 'Así verán los clientes la cola en el monitor de la sala.',
  },
};

function VetApp() {
  const { tickets, addTicket, callNext, complete, cancel } = useQueue();
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
      <Sidebar view={view} onChange={changeView} stats={stats} />

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

        {view === 'recepcion' ? (
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
        ) : (
          <WaitingRoom tickets={tickets} />
        )}
      </main>
    </div>
  );
}

export default VetApp;