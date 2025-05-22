import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../shared/models/cliente.model';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);

  // Signals para el estado del componente
  clientes = signal<any[]>([]);
  filteredClientes = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Form signals
  showModal = signal<boolean>(false);
  editingCliente = signal<any | null>(null);
  isEditing = signal<boolean>(false);

  // Search and filter
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('todos');

  // Form data
  clienteForm = signal<any>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    identificacion: '',
    tipoIdentificacion: 'cedula'
  });

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clienteService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading clientes:', err);
        this.error.set('Error al cargar los clientes');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.clientes()];
    
    // Aplicar filtro de búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(cliente =>
        cliente.nombre.toLowerCase().includes(search) ||
        cliente.apellidos.toLowerCase().includes(search) ||
        cliente.email.toLowerCase().includes(search) ||
        cliente.telefono.includes(search) ||
        cliente.identificacion.includes(search)
      );
    }

    // Aplicar filtro por tipo
    const filter = this.selectedFilter();
    if (filter !== 'todos') {
      // Puedes agregar más filtros aquí según tus necesidades
      // Por ejemplo: por ciudad, por tipo de identificación, etc.
    }

    this.filteredClientes.set(filtered);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openModal(cliente?: any): void {
    if (cliente) {
      this.editingCliente.set(cliente);
      this.isEditing.set(true);
      this.clienteForm.set({ ...cliente });
    } else {
      this.editingCliente.set(null);
      this.isEditing.set(false);
      this.resetForm();
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCliente.set(null);
    this.isEditing.set(false);
    this.resetForm();
  }
  resetForm(): void {
    this.clienteForm.set({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigoPostal: '',
      identificacion: '',
      tipoIdentificacion: 'cedula'
    });
  }
  saveCliente(): void {
    this.loading.set(true);
    this.error.set(null);

    const clienteData = this.clienteForm();

    if (this.isEditing()) {
      // Actualizar cliente existente
      this.clienteService.updateCliente(this.editingCliente().id, clienteData).subscribe({
        next: () => {
          this.loadClientes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating cliente:', err);
          this.error.set('Error al actualizar el cliente');
          this.loading.set(false);
        }
      });
    } else {
      // Crear nuevo cliente
      this.clienteService.createCliente(clienteData).subscribe({
        next: () => {
          this.loadClientes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating cliente:', err);
          this.error.set('Error al crear el cliente');
          this.loading.set(false);
        }
      });
    }
  }
  deleteCliente(clienteId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.clienteService.deleteCliente(clienteId).subscribe({
      next: () => {
        this.loadClientes();
      },
      error: (err) => {
        console.error('Error deleting cliente:', err);
        this.error.set('Error al eliminar el cliente');
        this.loading.set(false);
      }
    });
  }
}