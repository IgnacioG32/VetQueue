import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Employee } from '../types/employee';
import { toEmployee } from '../lib/fireStoreMappers';

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'employees'), orderBy('createdAt', 'asc'));
        return onSnapshot(
            q,
            (snapshot) => {
                setEmployees(snapshot.docs.map((d) => toEmployee(d.id, d.data({ serverTimestamps: 'estimate' }))));
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error(err);
                setLoading(false);
                setError('No se pudieron leer los empleados.');
            },
        );
    }, []);

    return { employees, loading, error };
}
