# Memoria del proyecto

## Feature: cuentas de empleados (turnos)

- Permisos: todos los empleados autenticados ven, crean y alteran tickets (mover a box, cerrar).
- Admin: además, gestiona empleados desde vista "Empleados" (sidebar, solo admin).
- RUT: se guarda como dato del perfil (`employees.rut`), no se usa para login (login sigue por correo).
- "Turnos" = turnos de pacientes (cola del día), no agenda de trabajo.
- Contraseña: el empleado la define vía email de reset (`sendPasswordResetEmail`).
- Creación sin cerrar sesión del admin: app Firebase secundaria (`getSecondaryAuth`).
- Deshabilitar/eliminar: lógico en `employees/{uid}` (`disabled`/`deleted`), sin backend.
- Admin no puede deshabilitarse a sí mismo; puede eliminarse con doble confirmación.
- Reglas: `firestore.rules` y `storage.rules` versionadas; admin por custom claim.

## Fix de navegación (esta sesión)

- `getViewFromHash` en `VetApp.tsx` debe reconocer `#sala` y `#empleados`; si no, el listener de `hashchange` revierte la vista a `recepcion` (requería doble clic y mandaba de sala a recepción al ir a Empleados).
- Nueva vista `'empleados'` en `View` y en `PAGE_INFO`.