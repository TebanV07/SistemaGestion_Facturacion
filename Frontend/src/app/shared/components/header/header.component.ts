import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { map, Observable } from 'rxjs';
import { Usuario } from '../../../shared/models/usuario.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  user$: Observable<Usuario | null> = this.authService.user$.pipe(
    // Map User to Usuario, or return null if user is null
    map((user: any) => {
      if (!user) return null;
      // Ensure all Usuario properties are present
      return {
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        activo: user.activo,
        // Add other properties if Usuario has more
      } as Usuario;
    })
  );
  
  getUserInitials(user: Usuario): string {
    if (!user.nombre || !user.apellido) return '?';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  }
  
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}