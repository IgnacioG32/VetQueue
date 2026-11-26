// Uso:
//   1. Descarga la clave de cuenta de servicio de Firebase (JSON) y guárdala fuera del repo.
//   2. Define la variable de entorno:
//        FIREBASE_SERVICE_ACCOUNT=C:\ruta\a\service-account.json
//        ADMIN_EMAIL=admin@tu-dominio.com   (o ADMIN_UID=...)
//   3. npm run set-admin
//
// Requiere: npm install (firebase-admin en devDependencies).

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountPath) {
    console.error('Falta FIREBASE_SERVICE_ACCOUNT (ruta al JSON de la cuenta de servicio).');
    process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const email = process.env.ADMIN_EMAIL;
const uid = process.env.ADMIN_UID;

if (!email && !uid) {
    console.error('Define ADMIN_EMAIL o ADMIN_UID.');
    process.exit(1);
}

const user = email ? await auth.getUserByEmail(email) : await auth.getUser(uid);
await auth.setCustomUserClaims(user.uid, { role: 'admin' });
console.log(`Claim role=admin asignado a ${user.email ?? user.uid} (${user.uid}).`);
console.log('Cierra y vuelve a iniciar sesión (o fuerza refresh del token) para que el claim se propague.');
