import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importer Router pour la navigation
import { UtilisateurService } from '../services/utilisateur.service';
import { AuthService } from '../services/auth.service';
import { AnneeScolaireService } from '../services/annee-scolaire.service';
import { EtablissementService } from '../services/etablissement.service';
import { ProfesseurService } from '../services/professeur.service';
import { UtilisateurDto } from '../api/model/utilisateurDto'; 
import { ProfesseurDto } from '../api';
import { LanguageService } from '../services/language.service'; // Importation du service de langue
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import localeFr from '@angular/common/locales/fr';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  username: string = 'Nom d\'utilisateur';  // Nom d'utilisateur affiché
  currentDate: Date = new Date();  // Date actuelle
  currentTime: string = '';  // Heure actuelle
  private intervalId: any;
  currentLang: string = 'fr'; // Langue par défaut

  etablissement: string = '';  // Nom de l'établissement
  anneeScolaire: string = '';  // Libellé de l'année scolaire

  constructor(
    private utilisateurService: UtilisateurService, 
    private authService: AuthService,
    private anneeScolaireService: AnneeScolaireService,
    private etablissementService: EtablissementService,
    private professeurService: ProfesseurService,
    private router: Router, // Injection de Router pour la navigation
    private languageService: LanguageService,
    private translate: TranslateService,  // Injecter TranslateService
    
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    registerLocaleData(localeAr, 'ar');
    registerLocaleData(localeFr, 'fr');
  }

  ngOnInit() {
    this.currentLang = this.languageService.getCurrentLanguage();
    this.languageService.setLanguageDirection(this.currentLang);
    this.updateTime();  // Mettre à jour l'heure
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000); // Mettre à jour toutes les secondes

    this.loadUserProfile();  // Charger les informations de l'utilisateur
    this.loadEtablissement();  // Charger l'établissement de l'utilisateur
    this.loadAnneeScolaire();  // Charger l'année scolaire de l'utilisateur

    // Écouter les changements de langue
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLang = lang;
      this.updateTime(); // Mettre à jour la date au changement de langue
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);  // Nettoyer l'intervalle lorsqu'il est détruit
    }
  }

  // Mettre à jour l'heure
  updateTime() {
    this.currentDate = new Date();
    this.currentTime = this.currentDate.toLocaleTimeString();
  }

  // Charger le profil de l'utilisateur à partir du service d'authentification
  loadUserProfile() {
    if (!this.authService.isLoggedIn()) {
      console.error('Utilisateur non connecté.');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Token JWT non trouvé.');
      return;
    }

    const decodedToken = this.decodeToken(token);
    const email = decodedToken?.email || decodedToken?.sub || decodedToken?.username;

    if (!email) {
      console.error('Email (ou autre identifiant) introuvable dans le token.');
      return;
    }

    // Récupérer les détails de l'utilisateur en fonction de l'email
    this.utilisateurService.getUtilisateurByEmail(email).subscribe({
      next: (user: UtilisateurDto) => {
        if (!user.id) {
          console.error('ID utilisateur introuvable.');
          return;
        }

        // Récupérer les détails du professeur à partir de l'utilisateur
        this.professeurService.getProfesseurByUtilisateurId(user.id).subscribe({
          next: (professeur: ProfesseurDto) => {
            this.username = `${professeur.prenom} ${professeur.nom}` || 'Utilisateur';
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des détails du professeur:', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des informations utilisateur:', err);
      }
    });
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

  // Charger les détails de l'établissement à partir de l'ID de l'utilisateur
  loadEtablissement() {
    const etablissementId = this.authService.getEtablissementId();
    if (etablissementId) {
      this.etablissementService.getEtablissementById(etablissementId).subscribe({
        next: (etablissement) => {
          this.etablissement = etablissement.libelle ?? 'Établissement non spécifié';
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'établissement:', err);
        }
      });
    }
  }

  // Charger les détails de l'année scolaire à partir de l'ID de l'utilisateur
  loadAnneeScolaire() {
    const anneeScolaireId = this.authService.getAnneeScolaireId();
    if (anneeScolaireId) {
      this.anneeScolaireService.findById(anneeScolaireId).subscribe({
        next: (anneeScolaire) => {
          this.anneeScolaire = anneeScolaire.libelle ?? 'Année scolaire non spécifiée';
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'année scolaire:', err);
        }
      });
    }
  }

  // Méthode de déconnexion
  logout() {
    this.authService.logout(); // Efface le token JWT et les autres données stockées
    this.router.navigate(['/login']); // Redirection vers la page de login après déconnexion
  }
}
