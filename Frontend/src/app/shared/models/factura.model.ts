export interface LineaFactura {
  id?: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  total: number;
}

export interface Factura {
  id?: string;
  numero: string;
  fechaEmision: Date;
  fechaVencimiento: Date;
  clienteId: string;
  clienteNombre?: string;
  usuarioId: string;
  usuarioNombre?: string;
  lineas: LineaFactura[];
  subtotal: number;
  iva: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'cancelada';
  notas?: string;
}