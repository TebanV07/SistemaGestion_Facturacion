import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacturaService } from '../../../core/services/factura.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ProductoService } from '../../../core/services/producto.service';
import { Factura } from '../../../shared/models/factura.model';
import { Cliente } from '../../../shared/models/cliente.model';
import { Producto } from '../../../shared/models/producto.model';

@Component({
  selector: 'app-crear-factura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-factura.component.html',
  styleUrls: ['./crear-factura.component.css']
})
export class CrearFacturaComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private router = inject(Router);

  // Signals para el estado del componente
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Signals para crear factura
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  selectedCliente = signal<string>('');
  selectedProductos = signal<any[]>([]);
  
  // Filtro de productos
  productoSearchTerm = signal<string>('');
  filteredProductos = signal<Producto[]>([]);

  ngOnInit(): void {
    this.loadClientes();
    this.loadProductos();
  }

  loadClientes(): void {
    this.loading.set(true);
    
    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading clientes:', err);
        this.error.set('Error al cargar los clientes');
        this.loading.set(false);
      }
    });
  }

  loadProductos(): void {
    this.loading.set(true);
    
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.filteredProductos.set(productos);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading productos:', err);
        this.error.set('Error al cargar los productos');
        this.loading.set(false);
      }
    });
  }

  filterProductos(): void {
    const searchTerm = this.productoSearchTerm().toLowerCase();
    if (!searchTerm) {
      this.filteredProductos.set(this.productos());
      return;
    }
    
    const filtered = this.productos().filter(producto => 
      producto.nombre.toLowerCase().includes(searchTerm) ||
      producto.descripcion?.toLowerCase().includes(searchTerm) ||
      producto.codigo?.toLowerCase().includes(searchTerm)
    );
    
    this.filteredProductos.set(filtered);
  }

  addProductoToFactura(producto: Producto): void {
    const existingIndex = this.selectedProductos().findIndex(p => p.id === producto.id);
    
    if (existingIndex >= 0) {
      // Si el producto ya está en la lista, incrementar cantidad
      const updatedProductos = [...this.selectedProductos()];
      updatedProductos[existingIndex].cantidad += 1;
      updatedProductos[existingIndex].subtotal = updatedProductos[existingIndex].cantidad * updatedProductos[existingIndex].precio;
      this.selectedProductos.set(updatedProductos);
    } else {
      // Agregar nuevo producto a la lista
      this.selectedProductos.set([
        ...this.selectedProductos(),
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          subtotal: producto.precio
        }
      ]);
    }
  }

  updateCantidad(index: number, cantidad: number): void {
    if (cantidad <= 0) return;
    
    const updatedProductos = [...this.selectedProductos()];
    updatedProductos[index].cantidad = cantidad;
    updatedProductos[index].subtotal = cantidad * updatedProductos[index].precio;
    this.selectedProductos.set(updatedProductos);
  }

  removeProducto(index: number): void {
    const updatedProductos = [...this.selectedProductos()];
    updatedProductos.splice(index, 1);
    this.selectedProductos.set(updatedProductos);
  }

  calcularSubtotal(): number {
    return this.selectedProductos().reduce((total, item) => total + item.subtotal, 0);
  }

  calcularImpuestos(): number {
    return this.calcularSubtotal() * 0.15; // 12% de impuestos
  }

  calcularTotal(): number {
    return this.calcularSubtotal() + this.calcularImpuestos();
  }

  saveFactura(): void {
    if (!this.selectedCliente() || this.selectedProductos().length === 0) {
      this.error.set('Debe seleccionar un cliente y al menos un producto');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const nuevaFactura: Factura = {
      clienteId: this.selectedCliente(),
      items: this.selectedProductos().map(p => ({
        productoNombre: p.nombre,
        cantidad: p.cantidad,
        precioUnitario: p.precio,
        subtotal: p.subtotal
      })),
      subtotal: this.calcularSubtotal(),
      impuestos: this.calcularImpuestos().toString(),
      total: this.calcularTotal(),
      estado: 'emitida',
      fechaEmision: new Date(),
      numero: '', // This will be set by the backend
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usuarioId: '', // Set the appropriate user ID
      lineas: [],
      iva: this.calcularImpuestos()
    };

    this.facturaService.createFactura(nuevaFactura).subscribe({
      next: (factura) => {
        this.loading.set(false);
        // Navegar a la página de detalle de la factura recién creada
        this.router.navigate(['/facturas/detalle', factura.id]);
      },
      error: (err) => {
        console.error('Error creating factura:', err);
        this.error.set('Error al crear la factura');
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/facturas']);
  }
}