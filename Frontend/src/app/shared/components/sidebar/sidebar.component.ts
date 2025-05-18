// src/app/shared/components/sidebar/sidebar.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);
  
  isAdmin$: Observable<boolean> | undefined;
  collapsed = false;
  
  ngOnInit(): void {
    this.isAdmin$ = this.authService.user$.pipe(
      map(user => (user as any)?.role === 'admin')
    );
    
    // Verificar si hay una preferencia guardada para el estado de la barra lateral
    const storedState = localStorage.getItem('sidebarCollapsed');
    if (storedState) {
      this.collapsed = JSON.parse(storedState);
    }
    
    // Ajustar para móviles por defecto
    if (window.innerWidth < 768) {
      this.collapsed = true;
    }
  }
  
  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sidebarCollapsed', JSON.stringify(this.collapsed));
  }
}