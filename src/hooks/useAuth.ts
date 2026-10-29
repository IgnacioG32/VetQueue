import { useCallback, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';


export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setLoading(false);
        });
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    }, []);

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
    }, []);

    return { user, loading, signIn, signOut };
}