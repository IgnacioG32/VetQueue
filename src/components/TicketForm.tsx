import { useState } from 'react';
import type { NewTicketData, Species, Ticket } from '../types/queue';
import { VETERINARIANS } from '../data/Veterinarians';
import { isValidRut, formatRutInput } from '../utils/Rut';

const SPECIES: Species[] = ['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'];

const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

interface Props {
    onSubmit: (data: NewTicketData) => Promise<Ticket>;
}

export default function TicketForm({ onSubmit }: Props) {
    const [rut, setRut] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [petName, setPetName] = useState('');
    const [species, setSpecies] = useState<Species>('Perro');
    const [reason, setReason] = useState('');
    const [preferredVetId, setPreferredVetId] = useState('');
    const [rutError, setRutError] = useState('');
    const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidRut(rut)) {
            setRutError('RUT inválido. Revisa el número y el dígito verificador.');
            return;
        }

        setSubmitting(true);
        setSubmitError('');

        let ticket: Ticket;
        try {
            ticket = await onSubmit({
                ownerRut: rut,
                ownerName: ownerName.trim(),
                ownerPhone: ownerPhone.trim(),
                petName: petName.trim(),
                species,
                reason: reason.trim(),
                preferredVetId: preferredVetId || null,
            });
        } catch (error) {
            console.error(error);
            setSubmitError('No se pudo generar el ticket. Revisa tu conexión e inténtalo de nuevo.');
            setSubmitting(false);
            return;
        }
        setSubmitting(false);

        setLastTicket(ticket);
        setRut('');
        setOwnerName('');
        setOwnerPhone('');
        setPetName('');
        setSpecies('Perro');
        setReason('');
        setPreferredVetId('');
        setRutError('');
    };

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-3 border-slate-100">
                Ingresar Paciente
            </h2>

            {lastTicket && (
                <div
                    role="status"
                    className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-center"
                >
                    <p className="text-sm text-teal-700">Ticket generado para {lastTicket.petName}</p>
                    <p className="text-3xl font-extrabold text-teal-700 tracking-wide">
                        {lastTicket.ticketNumber}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <fieldset className="space-y-4">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Dueño
                    </legend>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            RUT
                        </label>
                        <input
                            type="text"
                            inputMode="text"
                            placeholder="12345678-K"
                            value={rut}
                            onChange={(e) => {
                                setRut(formatRutInput(e.target.value));
                                setRutError('');
                            }}
                            className={inputClass}
                            aria-invalid={!!rutError}
                            required
                        />
                        {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: María González"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Teléfono <span className="font-normal text-slate-400">(opcional)</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="+56 9 1234 5678"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 pt-2">
                        Mascota y consulta
                    </legend>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Pelusa"
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Especie
                            </label>
                            <select
                                value={species}
                                onChange={(e) => setSpecies(e.target.value as Species)}
                                className={inputClass}
                            >
                                {SPECIES.map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Motivo de la consulta
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Vacuna anual, control, cojera..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Veterinario preferido{' '}
                            <span className="font-normal text-slate-400">(opcional)</span>
                        </label>
                        <select
                            value={preferredVetId}
                            onChange={(e) => setPreferredVetId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Cualquiera disponible</option>
                            {VETERINARIANS.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name} · {v.specialty}
                                </option>
                            ))}
                        </select>
                    </div>
                </fieldset>

                {submitError && (
                    <p role="alert" className="text-sm text-red-600">
                        {submitError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-200"
                >
                    {submitting ? 'Generando…' : 'Generar Ticket'}
                </button>
            </form>
        </section>
    );
}