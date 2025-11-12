import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EtablissementProfesseurDto } from '../../app/api/model/etablissementProfesseurDto'; // Modifie le chemin selon ton projet
import { environment } from '../../environments/environment';; // Modifie selon la structure de ton projet

@Injectable({
  providedIn: 'root'
})
export class EtablissementProfesseurService {

  private baseUrl = `${environment.apiUrl}/etablissementprofesseur`; // Point de terminaison de l'API backend

  constructor(private http: HttpClient) { }

  /**
   * Créer une nouvelle relation établissement-professeur
   * @param etablissementProfesseurDto Les données de la relation à créer
   * @returns Un Observable de la réponse de l'API
   */
  create(etablissementProfesseurDto: EtablissementProfesseurDto): Observable<EtablissementProfesseurDto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<EtablissementProfesseurDto>(`${this.baseUrl}/create`, etablissementProfesseurDto, { headers });
  }

  /**
   * Récupérer une relation par son ID
   * @param id L'identifiant de la relation
   * @returns Un Observable de la relation trouvée
   */
  findById(id: number): Observable<EtablissementProfesseurDto> {
    return this.http.get<EtablissementProfesseurDto>(`${this.baseUrl}/${id}`);
  }

  /**
   * Récupérer toutes les relations entre établissements et professeurs
   * @returns Un Observable de la liste des relations
   */
  findAll(): Observable<EtablissementProfesseurDto[]> {
    return this.http.get<EtablissementProfesseurDto[]>(`${this.baseUrl}`);
  }

  /**
   * Supprimer une relation par son ID
   * @param id L'identifiant de la relation à supprimer
   * @returns Un Observable de la réponse de suppression
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  // Find by Professeur, Etablissement, and AnneeScolaire
  findByProfesseurAndEtablissementAndAnneeScolaire(idProfesseur: number, idEtablissement: number, idAnneeScolaire: number): Observable<EtablissementProfesseurDto> {
    return this.http.get<EtablissementProfesseurDto>(`${this.baseUrl}/professeur/${idProfesseur}/etablissement/${idEtablissement}/annee/${idAnneeScolaire}`);
  }
}
