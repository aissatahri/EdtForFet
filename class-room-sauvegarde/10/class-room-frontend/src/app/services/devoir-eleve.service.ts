import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EleveDevoirDto } from '../api'; // Modèle DTO à définir dans vos types
import { environment } from '../../environments/environment'; // Assurez-vous que vous avez une configuration d'environnement avec l'URL de base de votre API

@Injectable({
  providedIn: 'root',
})
export class DevoirEleveService {
  private apiUrl = environment.apiUrl + '/devoirs-eleves'; // APP_ROOT de votre backend

  constructor(private http: HttpClient) {}

  // Créer une nouvelle tâche pour un élève
  create(eleveDevoirDto: EleveDevoirDto): Observable<EleveDevoirDto> {
    return this.http.post<EleveDevoirDto>(`${this.apiUrl}/create`, eleveDevoirDto);
  }

  // Trouver une tâche par son ID
  findById(id: number): Observable<EleveDevoirDto> {
    return this.http.get<EleveDevoirDto>(`${this.apiUrl}/${id}`);
  }

  // Retourner toutes les tâches pour un élève donné
  findAllByEleve(eleveId: number): Observable<EleveDevoirDto[]> {
    return this.http.get<EleveDevoirDto[]>(`${this.apiUrl}/eleve/${eleveId}`);
  }

  // Retourner toutes les tâches pour un devoir donné
  findAllByDevoir(devoirId: number): Observable<EleveDevoirDto[]> {
    return this.http.get<EleveDevoirDto[]>(`${this.apiUrl}/devoir/${devoirId}`);
  }

  // Retourner toutes les tâches pour une date de passage spécifique
  findAllByDatePassage(datePassage: string): Observable<EleveDevoirDto[]> {
    return this.http.get<EleveDevoirDto[]>(`${this.apiUrl}/date-passages/${datePassage}`);
  }

  // Retourner toutes les tâches pour un élève et un devoir donnés
  findAllByEleveAndDevoir(eleveId: number, devoirId: number): Observable<EleveDevoirDto[]> {
    return this.http.get<EleveDevoirDto[]>(`${this.apiUrl}/eleve/${eleveId}/devoir/${devoirId}`);
  }

  // Supprimer une tâche par son ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
