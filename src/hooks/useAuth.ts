import { useCallback, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    type User,
    type UserCredential,
} from 'firebase/auth';
import { auth, db, getSecondaryAuth } from '../lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let out = '';
    for (let i = 0; i < 16; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const refreshClaims = useCallback(async () => {
        const current = auth.currentUser;
        if (!current) {
            setIsAdmin(false);
            return;
        }
        const token = await current.getIdTokenResult(true);
        setIsAdmin(token.claims.role === 'admin');
    }, []);

    useEffect(() => {
        return onAuthStateChanged(auth, async (nextUser) => {
            setUser(nextUser);
            if (nextUser) {
                try {
                    const token = await nextUser.getIdTokenResult();
                    setIsAdmin(token.claims.role === 'admin');
                } catch {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const createEmployeeAccount = useCallback(
        async (email: string, displayName: string, rut: string | null): Promise<UserCredential> => {
            const secondaryAuth = getSecondaryAuth();
            const cred = await createUserWithEmailAndPassword(
                secondaryAuth,
                email.trim(),
                generateTempPassword(),
            );
            if (displayName.trim()) {
                await updateProfile(cred.user, { displayName: displayName.trim() });
            }
            await sendPasswordResetEmail(secondaryAuth, email.trim());
            await firebaseSignOut(secondaryAuth);

            // Guardar perfil del empleado en Firestore (admin escribe).
            await setDoc(doc(db, 'employees', cred.user.uid), {
                name: displayName.trim() || email.trim(),
                email: email.trim(),
                rut: rut || null,
                role: 'employee',
                disabled: false,
                deleted: false,
                createdAt: serverTimestamp(),
            });
            return cred;
        },
        [],
    );

    const ensureEmployeeProfile = useCallback(
        async (user: User, role: 'admin' | 'employee') => {
            const ref = doc(db, 'employees', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) return;
            await setDoc(ref, {
                name: user.displayName || user.email || 'Empleado',
                email: user.email ?? '',
                rut: null,
                role,
                disabled: false,
                deleted: false,
                createdAt: serverTimestamp(),
            });
        },
        [],
    );

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
    }, []);

    return { user, loading, isAdmin, refreshClaims, signIn, createEmployeeAccount, ensureEmployeeProfile, signOut };
}