import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'facturas',
    loadComponent: () => import('./features/facturas/listar-factura/listar-factura.component').then(m => m.ListarFacturaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'facturas/crear',
    loadComponent: () => import('./features/facturas/crear-factura/crear-factura.component').then(m => m.CrearFacturaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'facturas/:id',
    loadComponent: () => import('./features/facturas/detalle-factura/detalle-factura.component').then(m => m.DetalleFacturaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'productos',
    loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];