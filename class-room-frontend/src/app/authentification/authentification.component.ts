import { Component, OnInit } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AnneeScolaireDto, EtablissementDto, ProfesseurDto } from '../api';
import { Router } from '@angular/router';
import { EtablissementService } from '../../app/services/etablissement.service';
import { AnneeScolaireService } from '../../app/services/annee-scolaire.service';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UtilisateurService } from '../services/utilisateur.service';
import { UserCreateComponent } from '../utilisateur/user-create/user-create.component';
import { ProfesseurCreateComponent } from '../professeur/professeur-create/professeur-create.component';
import { AnneeScolaireCreateComponent } from '../annee-scolaire/annee-scolaire-create/annee-scolaire-create.component';
import { EtablissementCreateComponent } from '../etablissement/etablissement-create/etablissement-create.component';
import { ProfesseurEtablissementCreateComponent } from '../professeur-etablissement/professeur-etablissement-create/professeur-etablissement-create.component';
import { ProfileComponent } from '../profile/profile.component';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-authentification',
  standalone: true,
  imports: [
    ModalComponent,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    UserCreateComponent,
    ProfesseurCreateComponent,
    AnneeScolaireCreateComponent,
    EtablissementCreateComponent,
    ProfesseurEtablissementCreateComponent,
    ProfileComponent,
    TranslateModule,
  ],
 
  templateUrl: './authentification.component.html',
  styleUrls: ['./authentification.component.css'],
})
export class AuthentificationComponent implements OnInit {
  loginForm!: FormGroup;
  loginError: string = '';
  submitted = false;
  etablissements: EtablissementDto[] = [];
  anneesScolaires: AnneeScolaireDto[] = [];
  establishments$: Observable<any[]>;
  academicYears$: Observable<any[]>;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,  // Injecter TranslateService
    private router: Router,
    private authService: AuthService,
    private establishmentService: EtablissementService,
    private academicYearService: AnneeScolaireService,
    private utilisateurService: UtilisateurService,
    private languageService: LanguageService,
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    this.establishments$ = this.establishmentService.establishments$;
    this.academicYears$ = this.academicYearService.anneesScolaires$;
  }

  ngOnInit(): void {
    // Charger la langue actuelle au démarrage
    const currentLang = this.languageService.getCurrentLanguage();
    this.languageService.setLanguageDirection(currentLang);
    // Initialisation du formulaire avec validation
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      etablissement: ['', Validators.required],
      anneeScolaire: ['', Validators.required],
    });

    this.loadEstablishments();
    this.loadAcademicYears();
  }

  loadEstablishments(): void {
    this.establishmentService
      .findAll()
      .subscribe((etablissements: EtablissementDto[]) => {
        this.etablissements = etablissements;
      });
  }

  loadAcademicYears(): void {
    this.academicYearService
      .findAll()
      .subscribe((anneesScolaires: AnneeScolaireDto[]) => {
        this.anneesScolaires = anneesScolaires;
      });
  }

  get f() {
    return this.loginForm.controls;
  }

  goToCreateProfile() {
    const modalElement = document.getElementById('profileModal');
    if (modalElement) {
      const profileModal = new (window as any).bootstrap.Modal(modalElement);
      profileModal.show();
    } else {
      console.error("La modale n'a pas été trouvée.");
    }
  }
  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      console.log('Le formulaire est invalide', this.loginForm);
      return;
    }

    const { username, password, etablissement, anneeScolaire } =
      this.loginForm.value;

    this.authService
      .authenticateAndAssociate(
        username,
        password,
        etablissement,
        anneeScolaire
      )
      .subscribe({
        next: (isAuthenticated) => {
          if (isAuthenticated) {
            console.log('Connexion réussie');
            this.router.navigate(['/dash']);
          } else {
            this.loginError =
              'Association entre professeur, établissement et année scolaire introuvable.';
          }
        },
        error: (error) => {
          console.error('Erreur lors de la connexion :', error);
          if (error.status === 401) {
            this.loginError = 'Identifiants incorrects. Veuillez réessayer.';
          } else if (error.status === 404) {
            this.loginError = 'Établissement ou année scolaire introuvable.';
          } else {
            this.loginError =
              'Une erreur est survenue. Veuillez réessayer plus tard.';
          }
        },
      });
  }

  changeLanguage(lang: string): void {
    // 1. Changer la langue via le service
    this.languageService.setLanguage(lang);

    // 2. Changer l'orientation de la page en fonction de la langue
    if (lang === 'ar') {
      // Si la langue est arabe, changer l'orientation en RTL
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else if (lang === 'fr') {
      // Si la langue est française, revenir à l'orientation LTR
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'fr');
    }

    // 3. Recharger la page (si nécessaire) pour appliquer les changements de langue
    //window.location.reload();
  }
}
