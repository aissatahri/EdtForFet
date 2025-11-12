import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DevoirDto } from '../api/model/devoirDto'; // Adjust the import based on your project structure
import { environment } from '../../environments/environment'; // Adjust the import based on your project structure

@Injectable({
  providedIn: 'root',
})
export class DevoirService {
  private apiUrl = `${environment.apiUrl}/devoirs`;

  constructor(private http: HttpClient) {}

  // Create a new Devoir
  createDevoir(devoirDto: DevoirDto): Observable<DevoirDto> {
    return this.http.post<DevoirDto>(`${this.apiUrl}/create`, devoirDto);
  }

  // Find a Devoir by ID
  getDevoirById(id: number): Observable<DevoirDto> {
    return this.http.get<DevoirDto>(`${this.apiUrl}/${id}`);
  }

  // Get all Devoirs
  getAllDevoirs(): Observable<DevoirDto[]> {
    return this.http.get<DevoirDto[]>(this.apiUrl);
  }

  // Find Devoirs by Period ID
  getDevoirsByPeriodeId(periodeId: number): Observable<DevoirDto[]> {
    return this.http.get<DevoirDto[]>(`${this.apiUrl}/periode/${periodeId}`);
  }

  // Find Devoirs by type
  getDevoirsByType(type: string): Observable<DevoirDto[]> {
    return this.http.get<DevoirDto[]>(`${this.apiUrl}/type/${type}`);
  }

  // Delete a Devoir by ID
  deleteDevoirById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
