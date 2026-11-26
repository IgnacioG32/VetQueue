export interface Employee {
    uid: string;
    name: string;
    email: string;
    rut: string | null;
    role: 'admin' | 'employee';
    disabled: boolean;
    deleted: boolean;
    createdAt: Date | null;
}
