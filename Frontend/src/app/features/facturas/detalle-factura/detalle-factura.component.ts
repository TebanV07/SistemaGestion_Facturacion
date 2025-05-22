import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturaService } from '../../../core/services/factura.service';
import { Factura } from '../../../shared/models/factura.model';

@Component({
  selector: 'app-detalle-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-factura.component.html',
  styleUrls: ['./detalle-factura.component.css']
})
export class DetalleFacturaComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Signals para el estado del componente
  factura = signal<Factura | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadFactura();
  }

  loadFactura(): void {
    this.loading.set(true);
    this.error.set(null);

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de factura no válido');
      this.loading.set(false);
      return;
    }

    this.facturaService.getFactura(id).subscribe({
      next: (factura) => {
        this.factura.set(factura);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading factura:', err);
        this.error.set('Error al cargar la factura');
        this.loading.set(false);
      }
    });
  }

generarPDF(): void {
    const factura = this.factura();
    if (!factura || !factura.id) return;
    
    this.loading.set(true);

    this.facturaService.generarPDF(factura.id!).subscribe({
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

  cancelarFactura(): void {
    if (!this.factura() || this.factura()!.estado !== 'emitida') return;
    
    if (!confirm('¿Está seguro que desea cancelar esta factura?')) return;
    
    this.loading.set(true);
    
    const factura = this.factura();
    if (!factura?.id) return;
    
    this.facturaService.updateFactura(factura.id, { estado: 'cancelada' }).subscribe({
      next: () => {
        this.loadFactura();
      },
      error: (err) => {
        console.error('Error cancelando factura:', err);
        this.error.set('Error al cancelar la factura');
        this.loading.set(false);
      }
    });
  }

  marcarComoPagada(): void {
    const factura = this.factura();
    if (!factura || factura.estado !== 'emitida') return;
    
    this.loading.set(true);
    
    if (!factura.id) return;
    this.facturaService.updateFactura(factura.id, { estado: 'pagada' }).subscribe({
      next: () => {
        this.loadFactura();
      },
      error: (err) => {
        console.error('Error actualizando factura:', err);
        this.error.set('Error al actualizar la factura');
        this.loading.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/facturas']);
  }
}