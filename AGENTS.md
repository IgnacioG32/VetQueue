# VetQueue — notas para agentes

## Stack

- React 19 + TypeScript + Vite 8 + Tailwind CSS 4
- Firebase Auth + Firestore (proyecto `vetqueue-ee44c`)
- Sin backend; SPA puramente del lado del cliente

## Comandos

- `npm run dev` — servidor de desarrollo de Vite (requiere `.env`)
- `npm run build` — `tsc -b && vite build` (typecheck + bundle)
- `npm run lint` — oxlint
- `npm run preview` — previsualizar el build de producción
- No hay suite de tests. Validar con `npm run lint && npm run build`.

Orden requerido al cambiar código: **lint → build** (`tsc -b` está dentro de `build`).

## Entorno

Copiar `env.example` a `.env` (ignorado por git) y rellenar `VITE_FIREBASE_*`. La app muestra la pantalla "Falta configurar Firebase" si faltan `apiKey`, `authDomain`, `projectId` o `appId`; no quitar esa guarda.

## Quirks de TypeScript / toolchain

- `tsconfig.app.json` activa `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`.
  - Las importaciones solo de tipos deben usar `import type`.
  - Evitar `enum` (no es borrable); usar tipos unión (ver `src/types/queue.ts`).
  - Quitar locales/parámetros sin usar o el build falla.
- Tailwind v4 se conecta vía `@tailwindcss/vite`; no hay `tailwind.config.*`. No agregar uno.
- Vite usa `babel-plugin-react-compiler` (`reactCompilerPreset`). Mantener los componentes puros.
- Referencias de proyecto: `tsc -b` construye `tsconfig.app.json` + `tsconfig.node.json`.

## Arquitectura

- Entrada: `src/main.tsx` → `src/VetApp.tsx` (una sola app, protegida por auth).
- Auth: `src/hooks/useAuth.ts` (Firebase Auth email/password). `Login.tsx` traduce códigos de error de Firebase a mensajes en español.
- Creación de cuentas: solo admin (custom claim `role: 'admin'`) desde la vista **Empleados** (sidebar, solo admin). Se usa app Firebase secundaria (`getSecondaryAuth`) para no cerrar la sesión del admin; se envía `sendPasswordResetEmail` para que el empleado defina su contraseña. Cada empleado tiene doc en `employees/{uid}` con estado `disabled`/`deleted`.
- Bloqueo: `useEmployeeStatus` vigila el doc propio y cierra sesión si está deshabilitado/eliminado.
- Cola: `src/hooks/useQueue.ts` lee/escribe las colecciones de Firestore `tickets`, `board`, `counters/{day}` (contador diario transaccional).
- Sala de espera pública: `src/hooks/useBoard.ts` lee `board` sin auth — mantener esa colección pública/legible.
- Vistas y hash: `View` = 'recepcion' | 'sala' | 'empleados'. `getViewFromHash` en `VetApp.tsx` debe reconocer **todos** los hashes (`#sala`, `#empleados`); si se añade una vista nueva, añadirla ahí también o el listener de `hashchange` la revertirá a `recepcion`.
- Empleados: `src/types/employee.ts`, `src/hooks/useEmployees.ts`, `src/hooks/useEmployeeStatus.ts`, `src/components/Employees.tsx`. Colección Firestore `employees/{uid}` con `disabled`/`deleted`.
- Los veterinarios están hardcodeados en `src/data/Veterinarians.ts` (V mayúscula en la ruta; respetar el casing exacto en los imports).

## Convenciones

- Los textos de la UI están en español; mantener el español en textos nuevos.
- Casing mixto en rutas (`VetApp.tsx`, `SideBar.tsx`, `Veterinarians.ts`) — respetar exactamente en sistemas sensibles a mayúsculas.
- Reglas de seguridad versionadas en `firestore.rules` y `storage.rules` (publicar en consola o con CLI). Admin = custom claim `role: 'admin'` (script `npm run set-admin`). No asumir reglas no publicadas.

## Fuentes de instrucciones

- `.opencode/commands/feature.md` referencia `AGENTS.md` y `MEMORY.MD` (actualmente vacío). Tratar `AGENTS.md` como la fuente de verdad.