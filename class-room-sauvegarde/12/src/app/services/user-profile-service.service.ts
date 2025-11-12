import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UtilisateurService } from './utilisateur.service';
import { ProfesseurService } from './professeur.service';
import { EtablissementService } from './etablissement.service';
import { AnneeScolaireService } from './annee-scolaire.service';
import { UtilisateurDto, ProfesseurDto, EtablissementDto, AnneeScolaireDto, EtablissementProfesseurDto } from '../api';
import { Observable, throwError } from 'rxjs';
import { EtablissementProfesseurService } from './etablissementprofesseur.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  constructor(
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private professeurService: ProfesseurService,
    private etablissementService: EtablissementService,
    private anneeScolaireService: AnneeScolaireService,
    private etablissementProfesseurService: EtablissementProfesseurService
  ) {}

  loadUserProfile(): Observable<ProfesseurDto> {
    return new Observable(observer => {
      if (!this.authService.isLoggedIn()) {
        observer.error('Utilisateur non connecté.');
        return;
      }

      const token = this.authService.getToken();
      if (!token) {
        observer.error('Token JWT non trouvé.');
        return;
      }

      const decodedToken = this.decodeToken(token);
      const email = decodedToken?.email || decodedToken?.sub || decodedToken?.username;

      if (!email) {
        observer.error('Email introuvable dans le token.');
        return;
      }

      this.utilisateurService.getUtilisateurByEmail(email).subscribe({
        next: (user: UtilisateurDto) => {
          if (!user.id) {
            observer.error('ID utilisateur introuvable.');
            return;
          }
          this.professeurService.getProfesseurByUtilisateurId(user.id).subscribe({
            next: (professeur: ProfesseurDto) => {
              observer.next(professeur);
              observer.complete();
            },
            error: err => observer.error('Erreur lors de la récupération des détails du professeur: ' + err),
          });
        },
        error: err => observer.error('Erreur lors de la récupération des informations utilisateur: ' + err),
      });
    });
  }

  loadEtablissement(): Observable<EtablissementDto> {
    const etablissementId = this.authService.getEtablissementId();
    if (!etablissementId) {
      return throwError('Établissement ID non trouvé.');
    }

    return this.etablissementService.getEtablissementById(etablissementId);
  }

  loadAnneeScolaire(): Observable<AnneeScolaireDto> {
    const anneeScolaireId = this.authService.getAnneeScolaireId();
    if (!anneeScolaireId) {
      return throwError('Année scolaire ID non trouvé.');
    }

    return this.anneeScolaireService.findById(anneeScolaireId);
  }

  fetchEtablissementProfesseur(professeurId: number, etablissementId: number, anneeScolaireId: number): Observable<EtablissementProfesseurDto> {
    return this.etablissementProfesseurService.findByProfesseurAndEtablissementAndAnneeScolaire(professeurId, etablissementId, anneeScolaireId);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }
}
