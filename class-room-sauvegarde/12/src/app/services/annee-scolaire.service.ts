// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable, throwError } from 'rxjs';
// import { AnneeScolaireDto } from '../api/model/anneeScolaireDto'; // Assurez-vous d'avoir ce modèle
// import { AuthService } from './auth.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AnneeScolaireService {
//   private apiUrl = 'http://localhost:8080/classroom/v1/anneescolaire';

//   constructor(private http: HttpClient, private authService : AuthService) {}

//   // Récupère le token JWT du localStorage ou d'où il est stocké
//   private getAuthHeaders(): HttpHeaders {
//     const token = this.authService.getToken(); // Assurez-vous que cette méthode renvoie le token
//     if (!token) {
//       throw new Error('Token JWT manquant !');
//     }
//     return new HttpHeaders({
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     });
//   }
  

//   // Méthode pour récupérer la liste des années scolaires
//   getAnneesScolaires(): Observable<AnneeScolaireDto[]> {
//     return this.http.get<AnneeScolaireDto[]>(`${this.apiUrl}/all`);
//   }

//   // Méthode pour créer une nouvelle année scolaire
//   addAnneeScolaire(anneeScolaireDto: AnneeScolaireDto): Observable<AnneeScolaireDto> {
//     const headers = this.getAuthHeaders();
//     return this.http.post<AnneeScolaireDto>(`${this.apiUrl}/create`, anneeScolaireDto, { headers });
//   }

//   // Méthode pour mettre à jour une année scolaire existante
//   updateAnneeScolaire(id: number, anneeScolaireDto: AnneeScolaireDto): Observable<AnneeScolaireDto> {
//     const headers = this.getAuthHeaders();
//     return this.http.put<AnneeScolaireDto>(`${this.apiUrl}/update/${id}`, anneeScolaireDto, { headers });
//   }

//   // Méthode pour supprimer une année scolaire par son ID
//   deleteAnneeScolaire(id: number): Observable<void> {
//     const headers = this.getAuthHeaders();
//     return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, { headers });
//   }

//   // Méthode pour récupérer une année scolaire par ID
//   findAnneeScolaireById(id: number): Observable<AnneeScolaireDto> {
//     const headers = this.getAuthHeaders();
//     return this.http.get<AnneeScolaireDto>(`${this.apiUrl}/${id}`, { headers });
//   }

//   // Méthode pour récupérer une année scolaire par libellé
//   findAnneeScolaireByLibelle(libelle: string): Observable<AnneeScolaireDto> {
//     const headers = this.getAuthHeaders();
//     return this.http.get<AnneeScolaireDto>(`${this.apiUrl}/libelle/${libelle}`, { headers });
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AnneeScolaireDto } from '../../app/api/model/anneeScolaireDto';

@Injectable({
  providedIn: 'root'
})
export class AnneeScolaireService {
  private apiUrl = `${environment.apiUrl}/anneescolaire`;

  // BehaviorSubject pour maintenir et diffuser la liste des années scolaires
  private anneeScolaireSubject = new BehaviorSubject<AnneeScolaireDto[]>([]);
  public anneesScolaires$ = this.anneeScolaireSubject.asObservable(); // Observable pour s'abonner aux changements

  constructor(private http: HttpClient) {
    //this.loadAcademicYears();
    this.updateAnneeScolaireList();
  }

  // loadAcademicYears(): void {
  //   this.http.get<AnneeScolaireDto[]>(`${this.apiUrl}`).pipe(
  //     catchError(this.handleError)
  //   ).subscribe(data => this.anneeScolaireSubject.next(data));
  // }


  // Méthode pour mettre à jour la liste des années scolaires
  private updateAnneeScolaireList(): void {
    this.findAll().subscribe((anneesScolaires) => {
      this.anneeScolaireSubject.next(anneesScolaires); // Met à jour le BehaviorSubject avec la nouvelle liste
    });
  }

  // Méthode pour créer une nouvelle année scolaire et mettre à jour la liste
  create(anneeScolaire: AnneeScolaireDto): Observable<AnneeScolaireDto> {
    return this.http.post<AnneeScolaireDto>(`${this.apiUrl}/create`, anneeScolaire, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(() => this.updateAnneeScolaireList()), // Mise à jour de la liste après création
      catchError(this.handleError)
    );
  }

  // Méthode pour mettre à jour une année scolaire existante
  update(id: number, anneeScolaire: AnneeScolaireDto): Observable<AnneeScolaireDto> {
    return this.http.put<AnneeScolaireDto>(`${this.apiUrl}/update/${id}`, anneeScolaire, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(() => this.updateAnneeScolaireList()), // Mise à jour de la liste après modification
      catchError(this.handleError)
    );
  }

  // Méthode pour récupérer une année scolaire par ID
  findById(id: number): Observable<AnneeScolaireDto> {
    return this.http.get<AnneeScolaireDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour récupérer une année scolaire par libellé
  findByLibelle(libelle: string): Observable<AnneeScolaireDto> {
    return this.http.get<AnneeScolaireDto>(`${this.apiUrl}/libelle/${libelle}`).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour récupérer toutes les années scolaires
  findAll(): Observable<AnneeScolaireDto[]> {
    return this.http.get<AnneeScolaireDto[]>(`${this.apiUrl}/all`).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour supprimer une année scolaire par ID et mettre à jour la liste
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      tap(() => this.updateAnneeScolaireList()), // Mise à jour de la liste après suppression
      catchError(this.handleError)
    );
  }

  // Méthode pour gérer les erreurs HTTP
  private handleError(error: any) {
    console.error('An error occurred:', error); // Affichage de l'erreur dans la console
    return throwError(error); // Propagation de l'erreur
  }
}
