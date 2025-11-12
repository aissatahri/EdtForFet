import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Assurez-vous que vous avez une configuration d'environnement avec l'URL de base de votre API

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  private apiUrl = environment.apiUrl + '/excel/upload'; // URL de l'API Spring Boot

  constructor(private http: HttpClient) { }

  uploadExcel(file: File, classeId: number, periodeId: number, devoirId: number): Observable<Blob> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('classeId', classeId.toString());  // Utilisation des IDs
    formData.append('periodeId', periodeId.toString());  // Utilisation des IDs
    formData.append('devoirId', devoirId.toString());  // Utilisation des IDs

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': 'application/octet-stream',
      }),
      responseType: 'blob' as 'json'
    };

    return this.http.post<Blob>(this.apiUrl, formData, httpOptions);
  }
}
