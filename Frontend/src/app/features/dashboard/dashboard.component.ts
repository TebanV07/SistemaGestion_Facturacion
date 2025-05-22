import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';
import { ProductoService } from '../../core/services/producto.service';
import { FacturaService } from '../../core/services/factura.service';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../shared/models/cliente.model';
import { Producto } from '../../shared/models/producto.model';
import { Factura } from '../../shared/models/factura.model';

interface DashboardStats {
  totalClientes: number;
  totalProductos: number;
  totalFacturas: number;
  ventasDelMes: number;
  facturasPendientes: number;
  productosConPocoStock: number;
}

interface RecentActivity {
  id: string;
  description: string;
  date: Date;
  icon: string;
  type: 'cliente' | 'producto' | 'factura';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private facturaService = inject(FacturaService);

  // Signals para el estado del componente
  stats = signal<DashboardStats>({
    totalClientes: 0,
    totalProductos: 0,
    totalFacturas: 0,
    ventasDelMes: 0,
    facturasPendientes: 0,
    productosConPocoStock: 0
  });

  recentActivities = signal<RecentActivity[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      clientes: this.clienteService.getClientes(),
      productos: this.productoService.getProductos(),
      facturas: this.facturaService.getFacturas()
    }).subscribe({
      next: (data) => {
        this.calculateStats(data);
        this.generateRecentActivities(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error.set('Error al cargar los datos del dashboard');
        this.loading.set(false);
      }
    });
  }

  private calculateStats(data: any): void {
    const { clientes, productos, facturas } = data;
    
    // Calcular ventas del mes actual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const ventasDelMes = facturas
      .filter((f: any) => {
        const facturaDate = f.fechaEmision?.toDate ? f.fechaEmision.toDate() : new Date(f.fechaEmision);
        return facturaDate.getMonth() === currentMonth && 
               facturaDate.getFullYear() === currentYear &&
               f.estado !== 'cancelada';
      })
      .reduce((total: number, f: any) => total + (f.total || 0), 0);

    // Facturas pendientes (estado 'pendiente' o 'vencida')
    const facturasPendientes = facturas.filter((f: any) => 
      f.estado === 'pendiente' || f.estado === 'vencida'
    ).length;

    // Productos con poco stock (menos de 10 unidades)
    const productosConPocoStock = productos.filter((p: any) => 
      (p.stock || 0) < 10
    ).length;

    this.stats.set({
      totalClientes: clientes.length,
      totalProductos: productos.length,
      totalFacturas: facturas.length,
      ventasDelMes,
      facturasPendientes,
      productosConPocoStock
    });
  }

  private generateRecentActivities(data: any): void {
    const activities: RecentActivity[] = [];
    
    // Últimas facturas (últimas 3)
    const recentInvoices = data.facturas
      .sort((a: any, b: any) => {
        const dateA = a.fechaEmision?.toDate ? a.fechaEmision.toDate() : new Date(a.fechaEmision);
        const dateB = b.fechaEmision?.toDate ? b.fechaEmision.toDate() : new Date(b.fechaEmision);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3);

    recentInvoices.forEach((factura: any) => {
      activities.push({
        id: factura.id || '',
        description: `Factura ${factura.numero} creada por $${factura.total}`,
        date: factura.fechaEmision?.toDate ? factura.fechaEmision.toDate() : new Date(factura.fechaEmision),
        icon: 'fa-file-invoice',
        type: 'factura'
      });
    });

    // Últimos clientes (últimos 2)
    const recentClients = data.clientes
      .filter((c: any) => c.fechaCreacion)
      .sort((a: any, b: any) => {
        const dateA = a.fechaCreacion?.toDate ? a.fechaCreacion.toDate() : new Date(a.fechaCreacion);
        const dateB = b.fechaCreacion?.toDate ? b.fechaCreacion.toDate() : new Date(b.fechaCreacion);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 2);

    recentClients.forEach((cliente: any) => {
      activities.push({
        id: cliente.id || '',
        description: `Nuevo cliente: ${cliente.nombre} ${cliente.apellidos}`,
        date: cliente.fechaCreacion?.toDate ? cliente.fechaCreacion.toDate() : new Date(cliente.fechaCreacion),
        icon: 'fa-user-plus',
        type: 'cliente'
      });
    });

    // Ordenar actividades por fecha (más recientes primero)
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    this.recentActivities.set(activities.slice(0, 5)); // Mostrar solo las 5 más recientes
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Métodos de utilidad para el template
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} días`;
    }
  }
}