import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth';
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { environment } from '../environment/environment';
import { tokenInterceptor } from './core/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // ✅ Mejorar hidratación
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    // ✅ Usar fetch para mejor SSR
    provideHttpClient(
      withInterceptors([tokenInterceptor]),
      withFetch()
    ),
    // ✅ Firebase App más robusto
    provideFirebaseApp(() => {
      if (typeof window !== 'undefined') {
        try {
          const app = getApps().length === 0
            ? initializeApp(environment.firebase)
            : getApp();
          return app;
        } catch (error) {
          console.error('Error inicializando Firebase App:', error);
          return null as any;
        }
      }
      // Crear app mock para servidor
      return {
        name: '[DEFAULT]',
        options: environment.firebase,
        automaticDataCollectionEnabled: false
      } as any;
    }),
    // ✅ Auth sin emuladores
    provideAuth(() => {
      if (typeof window !== 'undefined') {
        try {
          const auth = getAuth();
          // ✅ COMENTAR/QUITAR LA LÍNEA DE EMULATORS
          // if (environment.useEmulators && !environment.production) {
          //   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
          // }
          return auth;
        } catch (error) {
          console.error('Error inicializando Firebase Auth:', error);
          return null as any;
        }
      }
      return null as any;
    }),
    // ✅ Firestore sin emuladores
    provideFirestore(() => {
      if (typeof window !== 'undefined') {
        try {
          const firestore = getFirestore();
          // ✅ COMENTAR/QUITAR LA LÍNEA DE EMULATORS
          // if (environment.useEmulators && !environment.production) {
          //   connectFirestoreEmulator(firestore, 'localhost', 8080);
          // }
          return firestore;
        } catch (error) {
          console.error('Error inicializando Firestore:', error);
          return null as any;
        }
      }
      return null as any;
    })
  ]
};