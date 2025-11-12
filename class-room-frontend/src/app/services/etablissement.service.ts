import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { EtablissementDto } from '../api/model/etablissementDto'; // Ajuster le chemin selon l'organisation de vos fichiers

@Injectable({
  providedIn: 'root'
})
export class EtablissementService {
  private apiUrl = `${environment.apiUrl}/etablissement`;  // Base de l'URL de votre API

  // BehaviorSubject pour maintenir et diffuser la liste des établissements
  private establishmentsSubject = new BehaviorSubject<EtablissementDto[]>([]);
  public establishments$ = this.establishmentsSubject.asObservable(); // Observable pour s'abonner aux changements

  constructor(private http: HttpClient) {
    this.loadAllEtablissements(); // Charge les établissements au démarrage
    this.updateEtablissementList();
  }

  // Méthode pour mettre à jour la liste des professeurs
  private updateEtablissementList(): void {
    this.findAll().subscribe((establishments) => {
      this.establishmentsSubject.next(establishments); // Mettre à jour le BehaviorSubject avec la nouvelle liste
    });
  }

  // Charge la liste des établissements et met à jour le BehaviorSubject
  private loadAllEtablissements(): void {
    this.http.get<EtablissementDto[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    ).subscribe(data => this.establishmentsSubject.next(data));
  }

  // Récupère tous les établissements
  findAll(): Observable<EtablissementDto[]> {
    return this.http.get<EtablissementDto[]>(`${this.apiUrl}`).pipe(
      catchError(this.handleError)
    );
  }

  // Crée un nouvel établissement et met à jour la liste
  createEtablissement(etablissement: EtablissementDto): Observable<EtablissementDto> {
    return this.http.post<EtablissementDto>(`${this.apiUrl}/create`, etablissement).pipe(
      tap(() => this.loadAllEtablissements()), // Mise à jour de la liste après création
      catchError(this.handleError)
    );
  }

  // Récupère un établissement par ID
  getEtablissementById(id: number): Observable<EtablissementDto> {
    return this.http.get<EtablissementDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Supprime un établissement par ID et met à jour la liste
  deleteEtablissement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => this.loadAllEtablissements()), // Mise à jour de la liste après suppression
      catchError(this.handleError)
    );
  }

  // Méthode pour gérer les erreurs HTTP
  private handleError(error: any) {
    console.error('An error occurred:', error); // Affichage de l'erreur dans la console
    return throwError(error); // Propagation de l'erreur
  }

  // Update an establishment
  updateEtablissement(id: number, etablissementDto: EtablissementDto): Observable<EtablissementDto> {
    return this.http.put<EtablissementDto>(`${this.apiUrl}/update/${id}`, etablissementDto, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
}
