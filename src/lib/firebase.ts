import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Las claves viven en .env.local (ver .env.example). Vite solo expone las que empiezan con VITE_
const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** false si falta .env.local: la app muestra un aviso en vez de fallar. */
export const isFirebaseConfigured = ['apiKey', 'authDomain', 'projectId', 'appId'].every(
    (key) => {
        const value = config[key as keyof typeof config];
        return typeof value === 'string' && value.length > 0;
    },
);

const app = initializeApp(
    isFirebaseConfigured
        ? config
        : { apiKey: 'not-configured', projectId: 'not-configured', appId: 'not-configured' },
);

export const auth = getAuth(app);
export const db = getFirestore(app);