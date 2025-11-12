import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContenuDto } from '../api';

@Injectable({
  providedIn: 'root',
})
export class ContenuService {
  private apiUrl = `${environment.apiUrl}/contenu`;

  constructor(private http: HttpClient) {}

  // Save a new content
  save(contenuDto: ContenuDto): Observable<ContenuDto> {
    return this.http.post<ContenuDto>(`${this.apiUrl}/create`, contenuDto);
  }

  // Find content by ID
  findById(id: number): Observable<ContenuDto> {
    return this.http.get<ContenuDto>(`${this.apiUrl}/${id}`);
  }

  // Find content by session ID
  findBySeanceId(seanceId: number): Observable<ContenuDto[]> {
    return this.http.get<ContenuDto[]>(`${this.apiUrl}/seance/${seanceId}`);
  }

  // Find content by date
  findByDate(date: string): Observable<ContenuDto[]> {
    return this.http.get<ContenuDto[]>(`${this.apiUrl}/date/${date}`);
  }

  // Find all contents
  findAll(): Observable<ContenuDto[]> {
    return this.http.get<ContenuDto[]>(`${this.apiUrl}`);
  }

  // Delete content by ID
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
