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
  estado: 'pendiente' | 'pagada' | 'cancelada' | 'emitida';
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
  notas?: string;
  clienteDireccion?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  impuestos?: string;
  items: FacturaItem[];
  Observaciones?: string;
}

export interface FacturaItem {
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}