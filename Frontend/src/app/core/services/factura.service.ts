import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Factura } from '../../shared/models/factura.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private firebaseService = inject(FirebaseService);
  private http = inject(HttpClient);
  
  private readonly COLLECTION_PATH = 'facturas';
  
  // Obtener todas las facturas con datos del cliente
  getFacturas(): Observable<Factura[]> {
    return this.firebaseService.getCollection<Factura>(
      this.COLLECTION_PATH, 
      [this.firebaseService.orderBy('fechaEmision', 'desc')]
    ).pipe(
      switchMap(facturas => {
        if (facturas.length === 0) return of([]);
        
        // Obtener datos adicionales del cliente para cada factura
        const facturasConCliente = facturas.map(factura => 
          this.firebaseService.getDocument('clientes', factura.clienteId).pipe(
            map(cliente => ({
              ...factura,
              clienteNombre: `${(cliente as any).nombre} ${(cliente as any).apellidos}`
            }))
          )
        );
        
        return forkJoin(facturasConCliente);
      })
    );
  }
  
  // Obtener factura por ID
  getFactura(id: string): Observable<Factura> {
    return this.firebaseService.getDocument<Factura>(this.COLLECTION_PATH, id).pipe(
      switchMap(factura => 
        this.firebaseService.getDocument('clientes', factura.clienteId).pipe(
          map(cliente => ({
            ...factura,
            clienteNombre: `${(cliente as any).nombre} ${(cliente as any).apellidos}`
          }))
        )
      )
    );
  }
  
  // Crear factura (Firebase + Backend Python)
  createFactura(factura: Factura): Observable<Factura> {
    // Generar número de factura desde el backend Python
    return this.http.get<{numero: string}>(`${environment.apiUrl}/facturas/generar-numero`).pipe(
      switchMap(res => {
        const nuevaFactura: Factura = {
          ...factura,
          numero: res.numero,
          fechaEmision: new Date()
        };
        
        // Guardar en Firebase
        return this.firebaseService.addDocument<Factura>(this.COLLECTION_PATH, nuevaFactura).pipe(
          switchMap(docRef => {
            const id = docRef.id;
            // Sincronizar con backend Python
            return this.http.post<Factura>(`${environment.apiUrl}/facturas`, {
              ...nuevaFactura,
              id
            }).pipe(
              map(() => ({
                ...nuevaFactura,
                id
              }))
            );
          })
        );
      })
    );
  }
  
  // Actualizar factura
  updateFactura(id: string, factura: Partial<Factura>): Observable<void> {
    // Actualizar en Firebase
    return this.firebaseService.updateDocument<Factura>(this.COLLECTION_PATH, id, factura).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.put<void>(`${environment.apiUrl}/facturas/${id}`, factura))
    );
  }
  
  // Eliminar factura
  deleteFactura(id: string): Observable<void> {
    // Eliminar en Firebase
    return this.firebaseService.updateDocument<Factura>(this.COLLECTION_PATH, id, { estado: 'cancelada' }).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.delete<void>(`${environment.apiUrl}/facturas/${id}`))
    );
  }
  
  // Generar PDF desde el backend Python
  generarPDF(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/facturas/${id}/pdf`, {
      responseType: 'blob'
    });
  }
}