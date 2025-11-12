import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Classe } from '../api';  // Assurez-vous d'avoir défini ce modèle
import { environment } from '../../environments/environment'; // Pour accéder à l'URL de l'API

@Injectable({
  providedIn: 'root'
})
export class ClasseService {

  private apiUrl = `${environment.apiUrl}/classe`;  // Assurez-vous que `apiUrl` est bien défini dans `environment.ts`

  constructor(private http: HttpClient) { }

  // Méthode pour créer une nouvelle classe
  createClasse(classe: Classe): Observable<Classe> {
    return this.http.post<Classe>(`${this.apiUrl}/create`, classe);
  }

  // Méthode pour obtenir une classe par ID
  getClasseById(id: number): Observable<Classe> {
    return this.http.get<Classe>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour obtenir une classe par libelle
  getClasseByLibelle(libelle: string): Observable<Classe> {
    return this.http.get<Classe>(`${this.apiUrl}/libelle/${libelle}`);
  }

  // Méthode pour récupérer toutes les classes
  getAllClasses(): Observable<Classe[]> {
    return this.http.get<Classe[]>(this.apiUrl);
  }

  // Méthode pour supprimer une classe par ID
  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Méthode pour obtenir les classes par niveau
  getClassesByNiveau(niveauId: number): Observable<Classe[]> {
    return this.http.get<Classe[]>(`${this.apiUrl}/niveau/${niveauId}`);
  }

  // Méthode pour obtenir les classes ayant un nombre d'élèves supérieur à un seuil
  getClassesByNombreEleveGreaterThan(nombreEleve: number): Observable<Classe[]> {
    return this.http.get<Classe[]>(`${this.apiUrl}/nombre-eleve-greater-than/${nombreEleve}`);
  }

  // Méthode pour obtenir les classes ayant un nombre d'élèves inférieur ou égal à un seuil
  getClassesByNombreEleveLessThanEqual(nombreEleve: number): Observable<Classe[]> {
    return this.http.get<Classe[]>(`${this.apiUrl}/nombre-eleve-less-than-equal/${nombreEleve}`);
  }
}
