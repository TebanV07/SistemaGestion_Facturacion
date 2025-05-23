import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { of, throwError } from 'rxjs';

export const ssrInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // En servidor, interceptar peticiones a Firebase o APIs externas
  if (!isPlatformBrowser(platformId)) {
    // Bloquear peticiones Firebase en servidor
    if (req.url.includes('firebase') || req.url.includes('googleapis')) {
      return of({ status: 200, body: null } as any);
    }
    
    // Para tu backend, permitir solo si es necesario en SSR
    if (req.url.includes('/auth/') || req.url.includes('/login')) {
      return throwError(() => new Error('Auth no disponible en servidor'));
    }
  }
  
  return next(req);
};