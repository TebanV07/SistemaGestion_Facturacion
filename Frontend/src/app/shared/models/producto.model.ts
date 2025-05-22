export interface Producto {
imagenUrl: any;
  id?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  fechaCreacion?: Date;
  activo: boolean;
}