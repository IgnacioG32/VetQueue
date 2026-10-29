import { useCallback, useEffect, useRef, useState } from 'react';

const SPEECH_DELAY_MS = 900; // espera a que termine la campanilla

/**
 * Aviso sonoro para cuando se llama a un paciente: campanilla + anuncio por voz.
 * Los navegadores bloquean el audio hasta que el usuario hace clic en la página,
 * por eso el sonido se activa con un botón (`toggle`).
 */
export function useCallSound() {
    const ctxRef = useRef<AudioContext | null>(null);
    const enabledRef = useRef(false);
    const [enabled, setEnabled] = useState(false);

    const playChime = useCallback(() => {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        void ctx.resume();

        const start = ctx.currentTime;
        // Dos notas descendentes tipo "ding-dong"
        const notes: { freq: number; offset: number }[] = [
            { freq: 880, offset: 0 },
            { freq: 659.25, offset: 0.35 },
        ];
        for (const { freq, offset } of notes) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, start + offset);
            gain.gain.exponentialRampToValueAtTime(0.4, start + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.9);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start + offset);
            osc.stop(start + offset + 1);
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-CL';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }, []);

    /** Suena la campanilla y dice el mensaje, solo si el sonido está activado. */
    const announce = useCallback(
        (message: string) => {
            if (!enabledRef.current) return;
            playChime();
            window.setTimeout(() => {
                if (enabledRef.current) speak(message);
            }, SPEECH_DELAY_MS);
        },
        [playChime, speak],
    );

    const toggle = useCallback(() => {
        if (enabledRef.current) {
            enabledRef.current = false;
            setEnabled(false);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        } else {
            enabledRef.current = true;
            setEnabled(true);
            playChime(); // sirve de prueba y desbloquea el audio del navegador
        }
    }, [playChime]);

    // Al salir de la vista, corta cualquier anuncio y libera el audio
    useEffect(() => {
        return () => {
            enabledRef.current = false;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            void ctxRef.current?.close();
            ctxRef.current = null;
        };
    }, []);

    return { enabled, toggle, announce };
}