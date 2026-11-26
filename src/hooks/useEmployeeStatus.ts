import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from 'firebase/auth';

/**
 * Vigila el perfil del usuario en `employees/{uid}`.
 * Si está deshabilitado o eliminado lógicamente, cierra la sesión y devuelve un mensaje.
 */
export function useEmployeeStatus(
    user: User | null,
    signOut: () => Promise<void>,
): string | null {
    const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setBlockedMessage(null);
            return;
        }
        const ref = doc(db, 'employees', user.uid);
        return onSnapshot(
            ref,
            async (snap) => {
                if (!snap.exists()) return;
                const data = snap.data();
                if (data.disabled === true || data.deleted === true) {
                    setBlockedMessage(
                        'Tu cuenta fue deshabilitada o eliminada. Contacta al administrador.',
                    );
                    try {
                        await signOut();
                    } catch {
                        // ignore
                    }
                }
            },
            () => {
                // Sin permisos u otro error: no bloqueamos, las reglas se encargan.
            },
        );
    }, [user, signOut]);

    return blockedMessage;
}
