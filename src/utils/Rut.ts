/** Limpia y formatea mientras el usuario escribe: 12345678-K */
export function formatRutInput(raw: string): string {
    const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length <= 1) return clean;

    // La K solo es válida como dígito verificador (último carácter)
    const dv = clean.slice(-1);
    const body = clean.slice(0, -1).replace(/K/g, '').slice(0, 8);
    return `${body}-${dv}`;
}

/** Valida formato y dígito verificador (módulo 11). */
export function isValidRut(rut: string): boolean {
    const match = /^(\d{7,8})-([0-9K])$/.exec(rut);
    if (!match) return false;

    const [, body, dv] = match;
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += Number(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
    return expected === dv;
}