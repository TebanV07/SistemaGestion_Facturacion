import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, docData, addDoc, updateDoc, deleteDoc, query, where, orderBy, DocumentReference, setDoc } from '@angular/fire/firestore';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore = inject(Firestore);

  // Obtener colección con filtros opcionales
  getCollection<T>(path: string, queryFn?: any): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const queryRef = queryFn ? query(ref, ...queryFn) : ref;
    
    return collectionData(queryRef, { idField: 'id' }).pipe(
      map(items => items as T[]),
      catchError(error => throwError(() => new Error(`Error al obtener colección ${path}: ${error.message}`)))
    );
  }

  // Obtener documento por ID
  getDocument<T>(path: string, id: string): Observable<T> {
    const docRef = doc(this.firestore, path, id);
    
    return docData(docRef, { idField: 'id' }).pipe(
      map(item => item as T),
      catchError(error => throwError(() => new Error(`Error al obtener documento ${path}/${id}: ${error.message}`)))
    );
  }

  // Crear documento con ID generado automáticamente
  addDocument<T>(path: string, data: T): Observable<DocumentReference> {
    const ref = collection(this.firestore, path);
    
    return from(addDoc(ref, data as any)).pipe(
      catchError(error => throwError(() => new Error(`Error al crear documento en ${path}: ${error.message}`)))
    );
  }

  // Crear documento con ID personalizado
  setDocument<T>(path: string, id: string, data: T): Observable<void> {
    const docRef = doc(this.firestore, path, id);
    
    return from(setDoc(docRef, data as any)).pipe(
      catchError(error => throwError(() => new Error(`Error al establecer documento ${path}/${id}: ${error.message}`)))
    );
  }

  // Actualizar documento
  updateDocument<T>(path: string, id: string, data: Partial<T>): Observable<void> {
    const docRef = doc(this.firestore, path, id);
    
    return from(updateDoc(docRef, data as any)).pipe(
      catchError(error => throwError(() => new Error(`Error al actualizar documento ${path}/${id}: ${error.message}`)))
    );
  }

  // Eliminar documento
  deleteDocument(path: string, id: string): Observable<void> {
    const docRef = doc(this.firestore, path, id);
    
    return from(deleteDoc(docRef)).pipe(
      catchError(error => throwError(() => new Error(`Error al eliminar documento ${path}/${id}: ${error.message}`)))
    );
  }

  // Funciones de utilidad para consultas comunes
  where = where;
  orderBy = orderBy;
}