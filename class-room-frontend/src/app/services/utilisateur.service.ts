import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators'; // Tap pour intercepter les réponses
import { UtilisateurDto } from '../api/model/utilisateurDto';
import { ProfesseurDto } from '../api/model/professeurDto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {
  private apiUrl = `${environment.apiUrl}/utilisateur`;
  private utilisateursSubject = new BehaviorSubject<UtilisateurDto[]>([]);

  constructor(private http: HttpClient) {}

  // Récupérer les utilisateurs comme un Observable
  getUtilisateurs(): Observable<UtilisateurDto[]> {
    return this.utilisateursSubject.asObservable();
  }

  // Actualiser la liste des utilisateurs depuis l'API et notifier les abonnés
  updateUtilisateurs(): void {
    this.http.get<UtilisateurDto[]>(this.apiUrl).subscribe((utilisateurs) => {
      this.utilisateursSubject.next(utilisateurs);
    });
  }

  // Créer un nouvel utilisateur
  createUtilisateur(utilisateurDto: UtilisateurDto): Observable<UtilisateurDto> {
    return this.http
      .post<UtilisateurDto>(
        `${this.apiUrl}/create`,
        utilisateurDto,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      )
      .pipe(
        tap(() => {
          // Après la création, actualiser la liste des utilisateurs
          this.updateUtilisateurs();
        })
      );
  }

  // Récupérer un utilisateur par son ID
  getUtilisateurById(id: number): Observable<UtilisateurDto> {
    return this.http.get<UtilisateurDto>(`${this.apiUrl}/${id}`);
  }

  // Supprimer un utilisateur par son ID
  deleteUtilisateur(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => {
        this.updateUtilisateurs(); // Actualiser la liste après suppression
      })
    );
  }

  // Récupérer un utilisateur par email
  getUtilisateurByEmail(email: string): Observable<UtilisateurDto> {
    return this.http.get<UtilisateurDto>(`${this.apiUrl}/email/${email}`);
  }

  // Récupérer un professeur associé à un utilisateur par email
  getProfesseurByUtilisateurEmail(email: string): Observable<ProfesseurDto> {
    const professeurApiUrl = `${environment.apiUrl}/professeur/email/${email}`;
    return this.http.get<ProfesseurDto>(professeurApiUrl);
  }
}
