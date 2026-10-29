import { useEffect, useState } from 'react';
import { useQueue } from './hooks/useQueue.ts';
import TicketForm from './components/TicketForm.tsx';
import VetPanel from './components/VetPanel.tsx';
import TicketList from './components/TicketList.tsx';
import WaitingRoom from './components/WaitingForm.tsx';

type View = 'recepcion' | 'sala';

const getViewFromHash = (): View => (window.location.hash === '#sala' ? 'sala' : 'recepcion');

function VetApp() {
  const { tickets, addTicket, callNext, complete, cancel } = useQueue();
  const [view, setView] = useState<View>(getViewFromHash);

  // Permite abrir la pantalla de sala de espera directo con /#sala en otro monitor
  useEffect(() => {
    const onHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const changeView = (next: View) => {
    window.location.hash = next === 'sala' ? 'sala' : '';
    setView(next);
  };

  const tabClass = (active: boolean) =>
    `px-5 py-2 rounded-full font-semibold transition ${active ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="bg-slate-100 space-y-6 p-6 md:p-12 text-slate-800 font-sans min-h-screen">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-teal-700 md:text-5xl">
          🐾 VetQueue
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Sistema de Gestión de Turnos y Recepción Veterinaria
        </p>
      </header>

      <nav className="flex justify-center gap-3" aria-label="Vistas">
        <button className={tabClass(view === 'recepcion')} onClick={() => changeView('recepcion')}>
          Recepción
        </button>
        <button className={tabClass(view === 'sala')} onClick={() => changeView('sala')}>
          Sala de espera
        </button>
      </nav>

      {view === 'recepcion' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2">
            <TicketForm onSubmit={addTicket} />
          </div>
          <div className="lg:col-span-3 space-y-8">
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
    </div>
  );
}

export default VetApp;
