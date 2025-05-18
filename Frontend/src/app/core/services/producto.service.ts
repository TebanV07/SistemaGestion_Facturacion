import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Producto } from '../../shared/models/producto.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private firebaseService = inject(FirebaseService);
  private http = inject(HttpClient);
  
  private readonly COLLECTION_PATH = 'productos';
  
  // Obtener todos los productos activos
  getProductos(): Observable<Producto[]> {
    return this.firebaseService.getCollection<Producto>(
      this.COLLECTION_PATH,
      [
        this.firebaseService.where('activo', '==', true),
        this.firebaseService.orderBy('nombre')
      ]
    );
  }
  
  // Obtener productos por categoría
  getProductosByCategoria(categoria: string): Observable<Producto[]> {
    return this.firebaseService.getCollection<Producto>(
      this.COLLECTION_PATH,
      [
        this.firebaseService.where('activo', '==', true),
        this.firebaseService.where('categoria', '==', categoria),
        this.firebaseService.orderBy('nombre')
      ]
    );
  }
  
  // Obtener producto por ID
  getProducto(id: string): Observable<Producto> {
    return this.firebaseService.getDocument<Producto>(this.COLLECTION_PATH, id);
  }
  
  // Crear producto (Firebase + Backend Python)
  createProducto(producto: Producto): Observable<Producto> {
    const nuevoProducto: Producto = {
      ...producto,
      fechaCreacion: new Date(),
      activo: true
    };
    
    // Guardar en Firebase
    return this.firebaseService.addDocument<Producto>(this.COLLECTION_PATH, nuevoProducto).pipe(
      switchMap(docRef => {
        const id = docRef.id;
        // Sincronizar con backend Python
        return this.http.post<Producto>(`${environment.apiUrl}/productos`, {
          ...nuevoProducto,
          id
        }).pipe(
          switchMap(() => this.firebaseService.getDocument<Producto>(this.COLLECTION_PATH, id))
        );
      })
    );
  }
  
  // Actualizar producto
  updateProducto(id: string, producto: Partial<Producto>): Observable<void> {
    // Actualizar en Firebase
    return this.firebaseService.updateDocument<Producto>(this.COLLECTION_PATH, id, producto).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.put<void>(`${environment.apiUrl}/productos/${id}`, producto))
    );
  }
  
  // Eliminar producto (soft delete)
  deleteProducto(id: string): Observable<void> {
    // Desactivar en Firebase
    return this.firebaseService.updateDocument<Producto>(this.COLLECTION_PATH, id, { activo: false }).pipe(
      // Sincronizar con backend Python
      switchMap(() => this.http.delete<void>(`${environment.apiUrl}/productos/${id}`))
    );
  }
  
  // Buscar productos por término
  searchProductos(term: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${environment.apiUrl}/productos/search?term=${term}`);
  }
  
  // Actualizar stock
  updateStock(id: string, cantidad: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/productos/${id}/stock`, { cantidad });
  }
}