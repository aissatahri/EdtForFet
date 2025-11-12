import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PeriodeDto } from '../api/model/periodeDto'; // Adjust the import path based on your project structure
import { environment } from '../../environments/environment'; // Adjust based on your environment structure

@Injectable({
  providedIn: 'root',
})
export class PeriodeService {
  private apiUrl = `${environment.apiUrl}/periode`; // Define your API base URL

  constructor(private http: HttpClient) {}

  savePeriode(periodeDto: PeriodeDto): Observable<PeriodeDto> {
    // If there's an ID, treat it as an update
      return this.http.post<PeriodeDto>(`${this.apiUrl}/create`, periodeDto);
  }

  // Find a period by ID
  getPeriodeById(id: number): Observable<PeriodeDto> {
    return this.http.get<PeriodeDto>(`${this.apiUrl}/${id}`);
  }

  // Retrieve all periods
  getAllPeriodes(): Observable<PeriodeDto[]> {
    return this.http.get<PeriodeDto[]>(this.apiUrl);
  }

  // Delete a period by ID
  deletePeriode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Find periods by EtablissementProfesseur ID
  getPeriodesByEtablissementProfesseurId(etablissementProfesseurId: number): Observable<PeriodeDto[]> {
    return this.http.get<PeriodeDto[]>(`${this.apiUrl}/etablissement/${etablissementProfesseurId}`);
  }

  // Find periods by date range
  getPeriodesByDateRange(startDate: string, endDate: string): Observable<PeriodeDto[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<PeriodeDto[]>(`${this.apiUrl}/date-range`, { params });
  }
}
