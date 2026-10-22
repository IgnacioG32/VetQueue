import { useState } from 'react';
import './App.css'
import type { Ticket } from './types/queue';

function App() {

  const [rut, setRut] = useState('');
  const [petName, setPetName] = useState('');
  // Lista de  tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counter, setCounter] = useState(1);

  const handleRutChange = (term: React.ChangeEvent<HTMLInputElement>) => {
    let value = term.target.value.replace(/[^0-9kK]/g, '');
    if (value.length > 9) value = value.slice(0, 9);

    if (value.length > 1) {
      const body = value.slice(0, -1);
      const dv = value.slice(-1).toUpperCase();
      setRut(`${body}-${dv}`);
    } else {
      setRut(value.toUpperCase());
    }
  };

  const handleSubmit = (term: React.FormEvent) => {
    term.preventDefault();
    if (!rut || !petName) return;

    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      ticketNumber: `VET-${String(counter).padStart(2, '0')}`,
      ownerRut: rut,
      petName: petName.trim(),
      status: 'Esperando',
      createdAt: new Date(),
    };


    setTickets((prev) => [...prev, newTicket]);
    setCounter((prev) => prev + 1);

    setRut('');
    setPetName('');
  };

  return (



    <>
      <div className='bg-slate-100 space-y-4 p-6 md:p-12 text-slate-800 font-sans min-h-screen px-4'>


        {/* Header */}
        <header className='text-center space-y-2'>
          <h1 className="text-4xl font-extrabold tracking-tight text-teal-700 md:text-5xl">
            🐾 VetQueue
          </h1>
          <p className='text-lg text-slate-600 font-medium'>
            Sistemas de Gestion de Turnos y Recepcion Veterinaria
          </p>
        </header>



        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-start'>
          {/* Formulario de Ingreso */}
          <section className='bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6'>
            <h2 className='text-xl font-bold text-slate-800 border-b pb-3 border-slate-100'>
              Ingresar Paciente
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  RUT del Dueño
                </label>
                <input
                  type="text"
                  placeholder="12345678-K"
                  value={rut}
                  onChange={handleRutChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nombre de la Mascota
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pelusa / Bobi"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200"
              >
                Generar Ticket
              </button>
            </form>
          </section>
        </div>

      </div>
    </>
  )
}
export default App

