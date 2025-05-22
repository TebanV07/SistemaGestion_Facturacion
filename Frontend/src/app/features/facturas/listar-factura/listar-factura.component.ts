import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FacturaService } from '../../../core/services/factura.service';
import { Factura } from '../../../shared/models/factura.model';

@Component({
  selector: 'app-listar-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-factura.component.html',
  styleUrls: ['./listar-factura.component.css']
})
export class ListarFacturaComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private router = inject(Router);

  // Signals para el estado del componente
  facturas = signal<Factura[]>([]);
  filteredFacturas = signal<Factura[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Search and filter
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('todas');
  dateRange = signal<{start: string, end: string}>({
    start: '',
    end: ''
  });

  ngOnInit(): void {
    this.loadFacturas();
  }

  loadFacturas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.facturaService.getFacturas().subscribe({
      next: (facturas) => {
        this.facturas.set(facturas);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading facturas:', err);
        this.error.set('Error al cargar las facturas');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.facturas()];
    
    // Aplicar filtro de búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(factura =>
        factura.numero.toLowerCase().includes(search) ||
        factura.clienteNombre?.toLowerCase().includes(search)
      );
    }

    // Aplicar filtro por estado
    const filter = this.selectedFilter();
    if (filter !== 'todas') {
      filtered = filtered.filter(factura => factura.estado === filter);
    }

    // Aplicar filtro por rango de fechas
    const { start, end } = this.dateRange();
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59); // Incluir todo el día final
      
      filtered = filtered.filter(factura => {
        const facturaDate = new Date(factura.fechaEmision);
        return facturaDate >= startDate && facturaDate <= endDate;
      });
    }

    this.filteredFacturas.set(filtered);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  navigateToCrearFactura(): void {
    this.router.navigate(['/facturas/crear']);
  }

  navigateToDetalleFactura(id: string): void {
    this.router.navigate(['/facturas/detalle', id]);
  }

  generarPDF(id: string, event: Event): void {
    event.stopPropagation(); // Evitar navegación al detalle
    this.loading.set(true);
    
    this.facturaService.generarPDF(id).subscribe({
      next: (blob) => {
        this.loading.set(false);
        // Crear URL para el blob y abrir en nueva ventana
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Error generando PDF:', err);
        this.error.set('Error al generar el PDF');
        this.loading.set(false);
      }
    });
  }

  cancelarFactura(id: string, event: Event): void {
    event.stopPropagation(); // Evitar navegación al detalle
    if (!confirm('¿Está seguro que desea cancelar esta factura?')) return;
    
    this.loading.set(true);
    
    this.facturaService.updateFactura(id, { estado: 'cancelada' }).subscribe({
      next: () => {
        this.loadFacturas();
      },
      error: (err) => {
        console.error('Error cancelando factura:', err);
        this.error.set('Error al cancelar la factura');
        this.loading.set(false);
      }
    });
  }
}