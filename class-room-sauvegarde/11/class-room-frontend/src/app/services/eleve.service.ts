import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EleveDto } from '../api'; // Assure-toi d'importer le DTO

@Injectable({
  providedIn: 'root'
})
export class EleveService {
  private baseUrl = `${environment.apiUrl}/eleves`; // Change l'URL selon ton API

  constructor(private http: HttpClient) {}

  create(eleveDto: EleveDto): Observable<EleveDto> {
    return this.http.post<EleveDto>(`${this.baseUrl}/create`, eleveDto);
  }

  findById(id: number): Observable<EleveDto> {
    return this.http.get<EleveDto>(`${this.baseUrl}/${id}`);
  }

  findByCode(code: string): Observable<EleveDto> {
    return this.http.get<EleveDto>(`${this.baseUrl}/code/${code}`);
  }

  findByGender(gender: string): Observable<EleveDto[]> {
    return this.http.get<EleveDto[]>(`${this.baseUrl}/gender/${gender}`);
  }

  findByNom(nom: string): Observable<EleveDto[]> {
    return this.http.get<EleveDto[]>(`${this.baseUrl}/nom/${nom}`);
  }

  findByNumGreaterThan(num: number): Observable<EleveDto[]> {
    return this.http.get<EleveDto[]>(`${this.baseUrl}/numGreaterThan/${num}`);
  }

  findAll(): Observable<EleveDto[]> {
    return this.http.get<EleveDto[]>(`${this.baseUrl}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  updatePhoto(id: number, photo: File): Observable<EleveDto> {
    const formData: FormData = new FormData();
    formData.append('photo', photo);

    return this.http.patch<EleveDto>(`${this.baseUrl}/${id}/photo`, formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    });
  }
}
