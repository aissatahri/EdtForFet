import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { EtablissementProfesseurDto } from '../api/model/etablissementProfesseurDto';
import { ProfesseurDto } from '../api/model/professeurDto';
import { EtablissementProfesseurService } from './etablissementprofesseur.service';
import { UtilisateurService } from './utilisateur.service';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/classroom/v1/auth/login';
  private professeurUrl = 'http://localhost:8080/classroom/v1/utilisateur';
  private etablissementProfesseurUrl =
    'http://localhost:8080/classroom/v1/etablissementProfesseur';

  constructor(private http: HttpClient, 
    private etablissementprofesseurservice : EtablissementProfesseurService,
    private utilisateurService: UtilisateurService
  ) {

  }

  // 1. Authentification de l'utilisateur
  login(email: string, password: string): Observable<LoginResponse> {
    const credentials = { email, password };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<LoginResponse>(this.apiUrl, credentials, { headers });
  }

  // 2. Processus de connexion complet
  authenticateAndAssociate(
    email: string,
    password: string,
    etablissementId: number,
    anneeScolaireId: number
  ): Observable<EtablissementProfesseurDto> {
    return this.login(email, password).pipe(
      switchMap((loginResponse: LoginResponse) => {
        this.saveToken(loginResponse.token);
        this.setUserDetails(
          loginResponse.token,
          etablissementId,
          anneeScolaireId
        );
  
        // Récupérer le professeur par email
        return this.utilisateurService.getProfesseurByUtilisateurEmail(email);
      }),
      switchMap((professeur: ProfesseurDto) => {
        // Associer le professeur à l'établissement et à l'année scolaire
        return this.etablissementprofesseurservice.findByProfesseurAndEtablissementAndAnneeScolaire(
          professeur.idProfesseur!,
          etablissementId,
          anneeScolaireId
        );
      })
    );
  }
  
  

  // 3. Récupérer le professeur via l'email
  getProfessorByUser(email: string): Observable<ProfesseurDto> {
    return this.http.get<ProfesseurDto>(
      `${this.professeurUrl}/by-email/${email}`
    );
  }

  // 4. Valider l'association entre le professeur, l'établissement et l'année scolaire
  validateProfessorAssociation(
    professeurId: number,
    etablissementId: number,
    anneeScolaireId: number
  ): Observable<boolean> {
    return this.http
      .get<EtablissementProfesseurDto[]>(
        `${this.etablissementProfesseurUrl}?professeurId=${professeurId}&etablissementId=${etablissementId}&anneeScolaireId=${anneeScolaireId}`
      )
      .pipe(
        map((associations: EtablissementProfesseurDto[]) => {
          // Si une association est trouvée, renvoyer true
          return associations && associations.length > 0;
        })
      );
  }

  // Méthodes utilitaires pour gérer le token et les informations utilisateur
  saveToken(token: string): void {
    localStorage.setItem('jwtToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  setUserDetails(
    token: string,
    etablissementId: number,
    anneeScolaireId: number
  ) {
    const decodedToken = this.decodeToken(token);
    const email =
      decodedToken?.email || decodedToken?.sub || decodedToken?.username;

    if (email) {
      localStorage.setItem('userEmail', email);
    }
    localStorage.setItem('etablissementId', etablissementId.toString());
    localStorage.setItem('anneeScolaireId', anneeScolaireId.toString());
  }

  // Méthodes pour récupérer les informations de l'utilisateur
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getEtablissementId(): number | null {
    const id = localStorage.getItem('etablissementId');
    return id ? Number(id) : null;
  }

  getAnneeScolaireId(): number | null {
    const id = localStorage.getItem('anneeScolaireId');
    return id ? Number(id) : null;
  }

  // Méthode pour décoder le token JWT
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  // Méthode pour vérifier si le token est expiré
  isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    const expiry = decodedToken?.exp;
    if (expiry) {
      const expiryDate = new Date(expiry * 1000);
      return expiryDate < new Date();
    }
    return true;
  }

  // Méthode pour déconnecter l'utilisateur
  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('etablissementId');
    localStorage.removeItem('anneeScolaireId');
  }
  // Méthode pour vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token&& !this.isTokenExpired(token);; // Retourne true si le token est présent, false sinon
  }

  // 5. Vérifier l'association entre le professeur, l'établissement et l'année scolaire
checkAssociation(
  professeurId: number,
  etablissementId: number,
  anneeScolaireId: number
): Observable<boolean> {
  return this.etablissementprofesseurservice.findByProfesseurAndEtablissementAndAnneeScolaire(professeurId, etablissementId, anneeScolaireId)
    .pipe(
      map((association: EtablissementProfesseurDto) => !!association)
    );
}

}
