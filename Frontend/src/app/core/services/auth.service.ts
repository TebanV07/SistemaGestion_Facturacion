import { Injectable, signal, inject, PLATFORM_ID, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Usuario } from '../../shared/models/usuario.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth, { optional: true });
  private firestore = inject(Firestore, { optional: true });
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private currentUser = signal<Usuario | null>(null);

  private userSubject = new BehaviorSubject<User | null>(null);
  readonly user$: Observable<User | null> = this.userSubject.asObservable();
  readonly isLoggedIn$: Observable<boolean> = this.user$.pipe(map(user => !!user));
  readonly token$: Observable<string | null> = this.user$.pipe(
    switchMap(user => {
      if (user && isPlatformBrowser(this.platformId)) {
        return from(user.getIdToken() as Promise<string>);
      }
      return of(null as string | null);
    })
  );

  constructor() {
    // Solo configurar Firebase Auth en el cliente
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        if (this.auth) {
          onAuthStateChanged(this.auth, (user) => {
            this.userSubject.next(user);
          });
        }
      });
    }
  }

  getCurrentUser(): Usuario | null {
    return this.currentUser();
  }

  login(email: string, password: string): Observable<Usuario> {
    if (!isPlatformBrowser(this.platformId) || !this.auth) {
      return throwError(() => new Error('Auth no disponible en servidor'));
    }
    
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(cred => this.getUserData(cred.user.uid)),
      tap(user => this.currentUser.set(user)),
      catchError(error => throwError(() => new Error(`Error de autenticación: ${error.message}`)))
    );
  }

  register(usuario: Usuario, password: string): Observable<Usuario> {
    if (!isPlatformBrowser(this.platformId) || !this.auth || !this.firestore) {
      return throwError(() => new Error('Auth no disponible en servidor'));
    }

    return from(createUserWithEmailAndPassword(this.auth, usuario.email, password)).pipe(
      switchMap(cred => {
        const newUser: Usuario = {
          ...usuario,
          id: cred.user.uid,
          fechaCreacion: new Date()
        };
        return from(setDoc(doc(this.firestore!, 'usuarios', cred.user.uid), newUser)).pipe(
          map(() => newUser)
        );
      }),
      tap(user => this.currentUser.set(user)),
      catchError(error => throwError(() => new Error(`Error de registro: ${error.message}`)))
    );
  }

  logout(): Observable<void> {
    if (!isPlatformBrowser(this.platformId) || !this.auth) {
      this.currentUser.set(null);
      this.userSubject.next(null);
      return of(void 0);
    }

    return from(signOut(this.auth)).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  private getUserData(uid: string): Observable<Usuario> {
    if (!this.firestore) {
      return throwError(() => new Error('Firestore no disponible'));
    }

    return from(getDoc(doc(this.firestore, 'usuarios', uid))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Usuario;
        }
        throw new Error('Usuario no encontrado');
      })
    );
  }

  syncWithBackend(): Observable<any> {
    return this.token$.pipe(
      switchMap(token => {
        if (!token) return of(null);
        return this.http.post(`${environment.apiUrl}/auth/sync`, { token });
      })
    );
  }
}