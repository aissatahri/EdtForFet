import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbsenceDto } from '../api';  // Assurez-vous d'importer votre modèle AbsenceDto
import { environment } from '../../environments/environment';  // Remplacez par le bon chemin selon votre projet

@Injectable({
  providedIn: 'root'
})
export class AbsenceService {

  private apiUrl = `${environment.apiUrl}/absences`;  // Assurez-vous que l'URL de l'API est correcte

  constructor(private http: HttpClient) { }

  // Trouver toutes les absences pour un élève spécifique
  findByEleveId(eleveId: number): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.apiUrl}/eleve/${eleveId}`);
  }

  // Trouver toutes les absences à une date spécifique
  findByDate(date: string): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.apiUrl}/date/${date}`);
  }

  // Trouver toutes les absences par motif
  findByMotif(motif: string): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.apiUrl}/motif/${motif}`);
  }

  // Trouver toutes les absences par période
  findByPeriodeId(periodeId: number): Observable<AbsenceDto[]> {
    return this.http.get<AbsenceDto[]>(`${this.apiUrl}/periode/${periodeId}`);
  }

  // Créer une nouvelle absence
  createAbsence(absenceDto: AbsenceDto): Observable<AbsenceDto> {
    return this.http.post<AbsenceDto>(`${this.apiUrl}/create`, absenceDto);
  }

  // Trouver une absence par ID
  findById(id: number): Observable<AbsenceDto> {
    return this.http.get<AbsenceDto>(`${this.apiUrl}/${id}`);
  }

  // Supprimer une absence par ID
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
