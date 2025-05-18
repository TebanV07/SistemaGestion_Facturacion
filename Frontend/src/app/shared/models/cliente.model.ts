export interface Cliente {
  id?: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  nif: string;
  fechaCreacion?: Date;
  activo: boolean;
}
