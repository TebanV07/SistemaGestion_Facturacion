export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  fechaCreacion?: Date;
  activo: boolean;
}
