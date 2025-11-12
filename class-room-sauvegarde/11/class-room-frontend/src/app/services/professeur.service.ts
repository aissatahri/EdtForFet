import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { ProfesseurDto } from '../api/model/professeurDto';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProfesseurService {
  private apiUrl = `${environment.apiUrl}/professeur`; // Base URL of the API
  
  // Utilisation de BehaviorSubject pour maintenir et diffuser la liste des professeurs
  private professorsSubject = new BehaviorSubject<ProfesseurDto[]>([]);
  public professors$ = this.professorsSubject.asObservable(); // Observable pour s'abonner aux changements
  
  constructor(private http: HttpClient) {
    this.loadProfessors();
  }

  // Méthode pour mettre à jour la liste des professeurs
  private updateProfessorsList(): void {
    this.getAllProfesseurs().subscribe((professors) => {
      this.professorsSubject.next(professors); // Mettre à jour le BehaviorSubject avec la nouvelle liste
    });
  }

  private loadProfessors(): void {
    this.http.get<ProfesseurDto[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    ).subscribe(data => this.professorsSubject.next(data));
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(error);
  }

  // Create a new professor and update the list
  createProfesseur(professeurDto: ProfesseurDto): Observable<ProfesseurDto> {
    return this.http.post<ProfesseurDto>(
      `${this.apiUrl}/create`,
      professeurDto,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    ).pipe(
      tap(() => this.updateProfessorsList()) // Mettre à jour la liste après la création
    );
  }

  // Retrieve a professor by ID
  getProfesseurById(id: number): Observable<ProfesseurDto> {
    return this.http.get<ProfesseurDto>(`${this.apiUrl}/${id}`);
  }

  // Retrieve all professors
  getAllProfesseurs(): Observable<ProfesseurDto[]> {
    return this.http.get<ProfesseurDto[]>(this.apiUrl);
  }

  // Delete a professor by ID and update the list
  deleteProfesseur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => this.updateProfessorsList()) // Mettre à jour la liste après la suppression
    );
  }

  // Retrieve a professor by user ID
  getProfesseurByUtilisateurId(utilisateurId: number): Observable<ProfesseurDto> {
    return this.http.get<ProfesseurDto>(`${this.apiUrl}/utilisateur/${utilisateurId}`);
  }

  // Update a professor
  updateProfesseur(id: number, professeurDto: ProfesseurDto): Observable<ProfesseurDto> {
    return this.http.put<ProfesseurDto>(`${this.apiUrl}/update/${id}`, professeurDto, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
}
