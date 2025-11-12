import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClasseEleveDto } from '../api';

@Injectable({
  providedIn: 'root'
})
export class ClasseeleveService {
  private baseUrl = `${environment.apiUrl}/classe-eleve`;
  constructor(private http: HttpClient) {}

  create(classeEleveDto: ClasseEleveDto): Observable<ClasseEleveDto> {
    return this.http.post<ClasseEleveDto>(`${this.baseUrl}/create`, classeEleveDto);
  }

  findById(id: number): Observable<ClasseEleveDto> {
    return this.http.get<ClasseEleveDto>(`${this.baseUrl}/${id}`);
  }

  findByEleveId(eleveId: number): Observable<ClasseEleveDto[]> {
    return this.http.get<ClasseEleveDto[]>(`${this.baseUrl}/eleve/${eleveId}`);
  }

  findByClasseId(classeId: number): Observable<ClasseEleveDto[]> {
    return this.http.get<ClasseEleveDto[]>(`${this.baseUrl}/classe/${classeId}`);
  }

  findBySousClasseId(sousClasseId: number): Observable<ClasseEleveDto[]> {
    return this.http.get<ClasseEleveDto[]>(`${this.baseUrl}/sous-classe/${sousClasseId}`);
  }

  findByEleveIdAndClasseIdAndSousClasseId(eleveId: number, classeId: number, sousClasseId: number): Observable<ClasseEleveDto> {
    return this.http.get<ClasseEleveDto>(`${this.baseUrl}/eleve/${eleveId}/classe/${classeId}/sous-classe/${sousClasseId}`);
  }

  findAll(): Observable<ClasseEleveDto[]> {
    return this.http.get<ClasseEleveDto[]>(`${this.baseUrl}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // New method to get associations by class and subclass IDs
  findByClasseIdAndSousClasseId(classeId: number, sousClasseId: number): Observable<ClasseEleveDto[]> {
    return this.http.get<ClasseEleveDto[]>(`${this.baseUrl}/classe/${classeId}/sous-classe/${sousClasseId}`);
  }
}