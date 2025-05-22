import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../shared/models/producto.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);

  // Signals para el estado del componente
  productos = signal<Producto[]>([]);
  filteredProductos = signal<Producto[]>([]);
  categorias = signal<string[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Form signals
  showModal = signal<boolean>(false);
  editingProducto = signal<Producto | null>(null);
  isEditing = signal<boolean>(false);

  // Search and filter
  searchTerm = signal<string>('');
  selectedCategoria = signal<string>('todas');

  // Form data
  productoForm = signal<any>({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: '',
    codigoSKU: '',
    impuesto: 12,
    imagenUrl: ''
  });

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.extractCategorias(productos);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading productos:', err);
        this.error.set('Error al cargar los productos');
        this.loading.set(false);
      }
    });
  }

  extractCategorias(productos: Producto[]): void {
    const categoriasSet = new Set<string>();
    productos.forEach(producto => {
      if (producto.categoria) {
        categoriasSet.add(producto.categoria);
      }
    });
    this.categorias.set(Array.from(categoriasSet).sort());
  }

  applyFilters(): void {
    let filtered = [...this.productos()];
    
    // Aplicar filtro de búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(search) ||
        producto.descripcion?.toLowerCase().includes(search) ||
        producto.codigo?.toLowerCase().includes(search)
      );
    }

    // Aplicar filtro por categoría
    const categoria = this.selectedCategoria();
    if (categoria !== 'todas') {
      filtered = filtered.filter(producto => producto.categoria === categoria);
    }

    this.filteredProductos.set(filtered);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoriaChange(): void {
    this.applyFilters();
  }

  openModal(producto?: Producto): void {
    if (producto) {
      this.editingProducto.set(producto);
      this.isEditing.set(true);
      this.productoForm.set({ ...producto });
    } else {
      this.editingProducto.set(null);
      this.isEditing.set(false);
      this.resetForm();
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProducto.set(null);
    this.isEditing.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.productoForm.set({
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoria: '',
      codigoSKU: '',
      impuesto: 12,
      imagenUrl: ''
    });
  }

  saveProducto(): void {
    if (!this.productoForm().nombre || this.productoForm().precio <= 0) {
      this.error.set('El nombre y el precio son obligatorios');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const productoData = this.productoForm();

if (this.isEditing()) {
      // Actualizar producto existente
      const editing = this.editingProducto();
      if (!editing?.id) {
        this.error.set('El producto a editar no tiene un ID válido');
        this.loading.set(false);
        return;
      }
      this.productoService.updateProducto(editing.id, productoData).subscribe({
        next: () => {
          this.loadProductos();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating producto:', err);
          this.error.set('Error al actualizar el producto');
          this.loading.set(false);
        }
      });
    } else {
      // Crear nuevo producto
      this.productoService.createProducto(productoData).subscribe({
        next: () => {
          this.loadProductos();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating producto:', err);
          this.error.set('Error al crear el producto');
          this.loading.set(false);
        }
      });
    }
  }

  deleteProducto(productoId: string): void {
    if (!confirm('¿Está seguro que desea eliminar este producto?')) return;
    
    this.loading.set(true);
    this.error.set(null);

    this.productoService.deleteProducto(productoId).subscribe({
      next: () => {
        this.loadProductos();
      },
      error: (err) => {
        console.error('Error deleting producto:', err);
        this.error.set('Error al eliminar el producto');
        this.loading.set(false);
      }
    });
  }

  updateStock(producto: Producto, cantidad: number): void {
    if (!producto.id) {
      this.error.set('El producto no tiene un ID válido');
      return;
    }
    this.loading.set(true);
    
    this.productoService.updateStock(producto.id, cantidad).subscribe({
      next: () => {
        this.loadProductos();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        this.error.set('Error al actualizar el stock');
        this.loading.set(false);
      }
    });
  }
}