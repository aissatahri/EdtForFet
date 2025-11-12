import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeanceDto } from '../api'; // Assurez-vous que ce chemin correspond à votre structure de dossier
import { environment } from '../../environments/environment'; // Assurez-vous d'importer l'environnement pour l'URL de l'API

@Injectable({
  providedIn: 'root'
})
export class SeanceService {
  private apiUrl = `${environment.apiUrl}/seance`; // Remplacez `environment.apiUrl` par l'URL de votre API

  constructor(private http: HttpClient) {}

  // Méthode pour créer une nouvelle séance
  save(seanceDto: SeanceDto): Observable<SeanceDto> {
    return this.http.post<SeanceDto>(`${this.apiUrl}/create`, seanceDto);
  }

  // Méthode pour récupérer une séance par ID
  findById(id: number): Observable<SeanceDto> {
    return this.http.get<SeanceDto>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour récupérer toutes les séances
  findAll(): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(this.apiUrl);
  }

  // Méthode pour supprimer une séance par ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Méthode pour récupérer des séances par ID de professeur
  findByProfesseurId(idProfesseur: number): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(`${this.apiUrl}/professeur/${idProfesseur}`);
  }

  // Méthode pour récupérer des séances par ID de classe
  findByClasseId(idClasse: number): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(`${this.apiUrl}/classe/${idClasse}`);
  }

  // Méthode pour récupérer des séances par ID de sous-classe
  findBySousClasseId(idSousClasse: number): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(`${this.apiUrl}/sousclasse/${idSousClasse}`);
  }

  // Méthode pour récupérer des séances par jour
  findByJour(jour: string): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(`${this.apiUrl}/jour/${jour}`);
  }
}
