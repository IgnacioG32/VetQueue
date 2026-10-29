import type { Veterinarian } from '../types/queue';

export const VETERINARIANS: Veterinarian[] = [
    { id: 'vet-1', name: 'Dra. Camila Rojas', specialty: 'Medicina general', room: 'Box 1' },
    { id: 'vet-2', name: 'Dr. Matías Fuentes', specialty: 'Cirugía', room: 'Box 2' },
    { id: 'vet-3', name: 'Dra. Valentina Soto', specialty: 'Dermatología y exóticos', room: 'Box 3' },
];

export const getVet = (id: string | null): Veterinarian | undefined =>
    id ? VETERINARIANS.find((v) => v.id === id) : undefined;
