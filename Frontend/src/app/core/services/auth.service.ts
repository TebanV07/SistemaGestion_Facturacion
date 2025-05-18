import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState, user } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Usuario } from '../../shared/models/usuario.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  
  private currentUser = signal<Usuario | null>(null);
  
  readonly user$ = user(this.auth);
  readonly isLoggedIn$ = this.user$.pipe(map(user => !!user));
  readonly token$ = this.user$.pipe(
    switchMap(user => user ? from(user.getIdToken()) : of(null))
  );

  getCurrentUser(): Usuario | null {
    return this.currentUser();
  }

  login(email: string, password: string): Observable<Usuario> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(cred => this.getUserData(cred.user.uid)),
      tap(user => this.currentUser.set(user)),
      catchError(error => throwError(() => new Error(`Error de autenticación: ${error.message}`)))
    );
  }

  register(usuario: Usuario, password: string): Observable<Usuario> {
    return from(createUserWithEmailAndPassword(this.auth, usuario.email, password)).pipe(
      switchMap(cred => {
        const newUser: Usuario = {
          ...usuario,
          id: cred.user.uid,
          fechaCreacion: new Date()
        };
        return from(setDoc(doc(this.firestore, 'usuarios', cred.user.uid), newUser)).pipe(
          map(() => newUser)
        );
      }),
      tap(user => this.currentUser.set(user)),
      catchError(error => throwError(() => new Error(`Error de registro: ${error.message}`)))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  private getUserData(uid: string): Observable<Usuario> {
    return from(getDoc(doc(this.firestore, 'usuarios', uid))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Usuario;
        }
        throw new Error('Usuario no encontrado');
      })
    );
  }

  // Sincronizar credenciales con backend Python
  syncWithBackend(): Observable<any> {
    return this.token$.pipe(
      switchMap(token => {
        if (!token) return of(null);
        return this.http.post(`${environment.apiUrl}/auth/sync`, { token });
      })
    );
  }
}