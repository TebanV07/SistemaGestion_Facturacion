import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Cliente } from '../../shared/models/cliente.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private firebaseService = inject(FirebaseService);
  private http = inject(HttpClient);
  
  private readonly COLLECTION_PATH = 'clientes';
  
  // Obtener todos los clientes activos
  getClientes(): Observable<Cliente[]> {
    return this.firebaseService.getCollection<Cliente>(
      this.COLLECTION_PATH,
      [
        this.firebaseService.where('activo', '==', true),
        this.firebaseService.orderBy('nombre')
      ]
    );
  }
  
  // Obtener cliente por ID
  getCliente(id: string): Observable<Cliente> {
    return this.firebaseService.getDocument<Cliente>(this.COLLECTION_PATH, id);
  }
  
  // Crear cliente (Firebase + Backend Python)
  createCliente(cliente: Cliente): Observable<Cliente> {
    const nuevoCliente: Cliente = {
      ...cliente,
      fechaCreacion: new Date(),
      activo: true
    };
    
    // Guardar en Firebase
    return this.firebaseService.addDocument<Cliente>(this.COLLECTION_PATH, nuevoCliente).pipe(
      switchMap(docRef => {
        const id = docRef.id;
        // Sincronizar con backend Python
        return this.http.post<Cliente>(`${environment.apiUrl}/clientes`, {
          ...nuevoCliente,
          id
        }).pipe(
          switchMap(() => this.firebaseService.getDocument<Cliente>(this.COLLECTION_PATH, id))
        );
      })
    );
  }
  
  // Actualizar cliente
  updateCliente(id: string, cliente: Partial<Cliente>): Observable<void> {
    // Actualizar en Firebase
    return this.firebaseService.updateDocument<Cliente>(this.COLLECTION_PATH, id, cliente).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.put<void>(`${environment.apiUrl}/clientes/${id}`, cliente))
    );
  }
  
  // Eliminar cliente (soft delete)
  deleteCliente(id: string): Observable<void> {
    // Desactivar en Firebase
    return this.firebaseService.updateDocument<Cliente>(this.COLLECTION_PATH, id, { activo: false }).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.delete<void>(`${environment.apiUrl}/clientes/${id}`))
    );
  }

  // Buscar clientes por término
  searchClientes(term: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${environment.apiUrl}/clientes/search?term=${term}`);
  }
}