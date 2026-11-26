import { useState } from 'react';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import type { Employee } from '../types/employee';
import { useEmployees } from '../hooks/useEmployees';
import { formatRutInput, isValidRut } from '../utils/Rut';

interface Props {
    user: User;
    isAdmin: boolean;
    createEmployeeAccount: (email: string, displayName: string, rut: string | null) => Promise<unknown>;
}

const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition';

export default function Employees({ user, isAdmin, createEmployeeAccount }: Props) {
    const { employees, loading, error } = useEmployees();

    // Crear empleado
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createRut, setCreateRut] = useState('');
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [createSubmitting, setCreateSubmitting] = useState(false);

    // Editar nombre
    const [editingUid, setEditingUid] = useState<string | null>(null);
    const [nameDraft, setNameDraft] = useState('');
    const [rutDraft, setRutDraft] = useState('');

    // Deshabilitar / eliminar
    const [actionError, setActionError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [deleteInput, setDeleteInput] = useState('');
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const visibleEmployees = employees.filter((e) => !e.deleted);

    const rutTaken = async (rut: string, excludeUid?: string) => {
        const snap = await getDocs(query(collection(db, 'employees'), where('rut', '==', rut)));
        return snap.docs.some((d) => d.id !== excludeUid && d.data().deleted !== true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');

        if (!createEmail.trim()) {
            setCreateError('Ingresa el correo del empleado.');
            return;
        }
        const rutValue = createRut.trim() ? formatRutInput(createRut) : null;
        if (rutValue && !isValidRut(rutValue)) {
            setCreateError('RUT inválido.');
            return;
        }
        if (rutValue && (await rutTaken(rutValue))) {
            setCreateError('Ya existe un empleado con ese RUT.');
            return;
        }

        setCreateSubmitting(true);
        try {
            const cred = (await createEmployeeAccount(createEmail.trim(), createName.trim(), rutValue)) as { user: { uid: string } };
            await setDoc(doc(db, 'employees', cred.user.uid), {
                name: createName.trim() || createEmail.trim(),
                email: createEmail.trim(),
                rut: rutValue,
                role: 'employee',
                disabled: false,
                deleted: false,
                createdAt: serverTimestamp(),
            });
            setCreateSuccess('Cuenta creada. Se envió un correo para definir la contraseña.');
            setCreateName('');
            setCreateEmail('');
            setCreateRut('');
        } catch (err) {
            console.error(err);
            const code = (err as { code?: string })?.code;
            if (code === 'auth/email-already-in-use') setCreateError('Ya existe una cuenta con ese correo.');
            else if (code === 'auth/invalid-email') setCreateError('Correo inválido.');
            else setCreateError('No se pudo crear la cuenta. Inténtalo de nuevo.');
        } finally {
            setCreateSubmitting(false);
        }
    };

    const startEdit = (emp: Employee) => {
        setEditingUid(emp.uid);
        setNameDraft(emp.name);
        setRutDraft(emp.rut ?? '');
        setActionError('');
    };

    const saveName = async (emp: Employee) => {
        setActionError('');
        const rutValue = rutDraft.trim() ? formatRutInput(rutDraft) : null;
        if (rutValue && !isValidRut(rutValue)) {
            setActionError('RUT inválido.');
            return;
        }
        if (rutValue && (await rutTaken(rutValue, emp.uid))) {
            setActionError('Ya existe un empleado con ese RUT.');
            return;
        }
        try {
            await updateDoc(doc(db, 'employees', emp.uid), {
                name: nameDraft.trim() || emp.name,
                rut: rutValue,
            });
            // Si es el propio usuario, sincronizar displayName de Auth.
            if (emp.uid === user.uid) {
                await updateProfile(user, { displayName: nameDraft.trim() || emp.name });
            }
            setEditingUid(null);
        } catch (err) {
            console.error(err);
            setActionError('No se pudo guardar el empleado.');
        }
    };

    const toggleDisabled = async (emp: Employee) => {
        if (emp.uid === user.uid) return; // guardia extra
        setActionError('');
        try {
            await updateDoc(doc(db, 'employees', emp.uid), { disabled: !emp.disabled });
        } catch (err) {
            console.error(err);
            setActionError('No se pudo cambiar el estado.');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        if (deleteInput !== deleteTarget.email) return;
        setDeleteSubmitting(true);
        setActionError('');
        try {
            await updateDoc(doc(db, 'employees', deleteTarget.uid), {
                deleted: true,
                disabled: true,
            });
            // Si se elimina a sí mismo, cerrar sesión.
            if (deleteTarget.uid === user.uid) {
                await firebaseSignOut(auth);
            }
            setDeleteTarget(null);
            setDeleteInput('');
        } catch (err) {
            console.error(err);
            setActionError('No se pudo eliminar el empleado.');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    if (loading) return <p className="text-slate-500">Cargando empleados…</p>;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Empleados</h2>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setShowCreate(true);
                            setCreateError('');
                            setCreateSuccess('');
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-xl transition"
                    >
                        Crear empleado
                    </button>
                )}
            </div>

            {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}
            {actionError && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {actionError}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                            <th className="text-left px-4 py-3 font-semibold">RUT</th>
                            <th className="text-left px-4 py-3 font-semibold">Correo</th>
                            <th className="text-left px-4 py-3 font-semibold">Rol</th>
                            <th className="text-left px-4 py-3 font-semibold">Estado</th>
                            <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleEmployees.map((emp) => {
                            const isSelf = emp.uid === user.uid;
                            const isEditing = editingUid === emp.uid;
                            return (
                                <tr key={emp.uid} className="border-t border-slate-100">
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={nameDraft}
                                                onChange={(e) => setNameDraft(e.target.value)}
                                                className="px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-semibold text-slate-800">{emp.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={rutDraft}
                                                onChange={(e) => setRutDraft(formatRutInput(e.target.value))}
                                                className="px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        ) : (
                                            <span className="text-slate-600 font-mono text-xs">{emp.rut ?? '—'}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.role === 'admin' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                                            {emp.role === 'admin' ? 'Admin' : 'Empleado'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {emp.disabled ? 'Deshabilitado' : 'Activo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 justify-end">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => saveName(emp)}
                                                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUid(null)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold transition"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(emp)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
                                                    >
                                                        Editar
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => toggleDisabled(emp)}
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
                                                        >
                                                            {emp.disabled ? 'Habilitar' : 'Deshabilitar'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setDeleteTarget(emp);
                                                            setDeleteInput('');
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {visibleEmployees.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                                    Sin empleados registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal crear empleado */}
            {showCreate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-slate-800">Crear empleado</h3>
                        <p className="text-sm text-slate-500">
                            Se enviará un correo para que defina su contraseña.
                        </p>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Nombre <span className="font-normal text-slate-400">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    RUT <span className="font-normal text-slate-400">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={createRut}
                                    onChange={(e) => setCreateRut(formatRutInput(e.target.value))}
                                    placeholder="12345678-K"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Correo</label>
                                <input
                                    type="email"
                                    value={createEmail}
                                    onChange={(e) => setCreateEmail(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            {createError && <p role="alert" className="text-sm text-red-600">{createError}</p>}
                            {createSuccess && <p role="status" className="text-sm text-emerald-700">{createSuccess}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSubmitting}
                                    className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl transition"
                                >
                                    {createSubmitting ? 'Creando…' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal eliminar (doble confirmación) */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setDeleteTarget(null)}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-slate-800">Eliminar empleado</h3>
                        <p className="text-sm text-slate-600">
                            Esta acción deshabilita y oculta al empleado. Para confirmar, escribe su correo:
                        </p>
                        <p className="text-sm font-mono text-slate-500 break-all">{deleteTarget.email}</p>
                        <input
                            type="text"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder={deleteTarget.email}
                            className={inputClass}
                            autoFocus
                        />
                        {deleteTarget.uid === user.uid && (
                            <p role="alert" className="text-sm text-red-600 font-semibold">
                                Estás a punto de eliminarte a ti mismo. Perderás el acceso.
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleteSubmitting || deleteInput !== deleteTarget.email}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl transition"
                            >
                                {deleteSubmitting ? 'Eliminando…' : 'Eliminar definitivamente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
