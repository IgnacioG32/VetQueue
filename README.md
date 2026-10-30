# 🐾 VetQueue

Sistema de gestión de turnos y recepción para veterinarias. Resuelve el problema de las colas y las esperas: registra al dueño y a la mascota, genera un turno, asigna cada paciente a un veterinario y muestra la cola en un monitor para la sala de espera.

## Características

### Recepción
- **Ingreso de pacientes** con los datos del dueño (RUT chileno validado con dígito verificador, nombre y teléfono opcional) y de la mascota (nombre, especie y motivo de consulta).
- **Veterinario preferido** opcional: el cliente puede pedir atenderse con un profesional en particular.
- **Ticket correlativo** (`VET-01`, `VET-02`…) que se reinicia cada día.
- **Panel por veterinario** con su box y estado (Disponible / Atendiendo): llamar al siguiente paciente, finalizar o cancelar la atención.
- **Cola de espera** con posición, minutos de espera e historial de atenciones del día.

### Sala de espera
- Pantalla pensada para un monitor, con **"Ahora atendiendo"** por veterinario y la lista de **próximos turnos**.
- **Aviso de último llamado** destacado durante 90 segundos.
- **Sonido de llamado**: campanilla y anuncio por voz ("Turno VET 03. Pelusa, pase a Box 2").
- **Pantalla completa** y reloj con segundos.
- **Privacidad**: solo se muestra el nombre de la mascota, nunca el RUT ni los datos del dueño.

### Panel lateral
Navegación entre Recepción y Sala de espera, resumen del día (en espera, atendiendo, atendidos) y acceso para abrir la sala en otra pantalla.

## Tecnologías

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [FireBase](https://firebase.google.com/?hl=es-419)

## Instalación y uso

Requisitos: [Node.js](https://nodejs.org/) y npm.

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

Una vez en marcha, abre la dirección que muestra la terminal (normalmente `http://localhost:5173`).

## Cómo usarlo

1. En **Recepción**, completa el formulario y pulsa **Generar Ticket**.
2. Cuando un veterinario esté libre, pulsa **Llamar siguiente** en su tarjeta. Se llama al paciente más antiguo que no haya pedido a otro profesional.
3. Al terminar la consulta, pulsa **Finalizar atención**.
4. Para el monitor de la sala, usa **Abrir sala en otra pantalla** (o entra a `/#sala`), pulsa **Activar sonido** y, si quieres, **Pantalla completa**.

> El navegador bloquea el audio hasta que se hace un clic en la página. Por eso el sonido empieza desactivado y hay que activarlo cada vez que se recarga la pantalla de la sala.

## Estructura del proyecto

```
src/
├── App.tsx                  # Layout, navegación entre vistas
├── components/
│   ├── Sidebar.tsx          # Panel lateral
│   ├── TicketForm.tsx       # Formulario de ingreso
│   ├── VetPanel.tsx         # Panel de veterinarios
│   ├── TicketList.tsx       # Cola e historial del día
│   └── WaitingRoom.tsx      # Pantalla de la sala de espera
├── hooks/
│   ├── useQueue.ts          # Estado de la cola + persistencia
│   ├── useNow.ts            # Hora actual y minutos transcurridos
│   └── useCallSound.ts      # Campanilla y anuncio por voz
├── data/
│   └── veterinarians.ts     # Lista de veterinarios y boxes
├── types/
│   └── queue.ts             # Tipos: Ticket, Veterinarian, etc.
└── utils/
    └── rut.ts               # Formato y validación de RUT
```

## Configuración

Los veterinarios, sus especialidades y boxes están en `src/data/veterinarians.ts`. Edita ese archivo para reflejar al equipo real de la clínica.


### Limitaciones actuales
- Recepción y sala de espera deben estar en el mismo computador y navegador. Para usarlos en equipos distintos hace falta un backend.
- No hay inicio de sesión ni roles de usuario.
- No hay citas agendadas con fecha y hora, solo turnos del día.

## Próximos pasos

- [ ] Citas agendadas con fecha y hora.
- [ ] Inicio de sesión para recepción y veterinarios. (Faltan los 
- [ ] Ficha de historial por mascota.
- [ ] Notificaciones al dueño (SMS o WhatsApp) cuando se acerque su turno.
