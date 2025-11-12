import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SousClasseDto } from '../api';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SousclasseService {
  private apiServerUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public getSousClasses(): Observable<SousClasseDto[]> {
    return this.http.get<SousClasseDto[]>(`${this.apiServerUrl}/sousClasses/all`);
  }

  public getSousClasseById(sousClasseId: number): Observable<SousClasseDto> {
    return this.http.get<SousClasseDto>(`${this.apiServerUrl}/sousClasses/${sousClasseId}`);
  }

  public getSousClassesByClasseId(classeId: number): Observable<SousClasseDto[]> {
    return this.http.get<SousClasseDto[]>(`${this.apiServerUrl}/sousClasses/classe/${classeId}`);
  }

  public addSousClasse(sousClasse: SousClasseDto): Observable<SousClasseDto> {
    return this.http.post<SousClasseDto>(`${this.apiServerUrl}/sousClasses/create`, sousClasse);
  }

  public deleteSousClasse(sousClasseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiServerUrl}/sousClasses/delete/${sousClasseId}`);
  }
}