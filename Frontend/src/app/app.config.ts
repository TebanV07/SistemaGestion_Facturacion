import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environment/environment';
import { tokenInterceptor } from './core/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(), // Importante para SSR
    provideAnimations(),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideFirebaseApp(() => {
      // Solo inicializar Firebase en el cliente
      if (typeof window !== 'undefined') {
        return getApps().length === 0
          ? initializeApp(environment.firebase)
          : getApp();
      }
      // En el servidor, retornamos una app mock o null
      return null as any;
    }),
    provideAuth(() => {
      // Solo inicializar Auth en el cliente
      if (typeof window !== 'undefined') {
        return getAuth();
      }
      return null as any;
    }),
    provideFirestore(() => {
      // Solo inicializar Firestore en el cliente
      if (typeof window !== 'undefined') {
        return getFirestore();
      }
      return null as any;
    })
  ]
};