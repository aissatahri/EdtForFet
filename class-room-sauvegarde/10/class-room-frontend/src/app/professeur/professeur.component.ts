import { Component, OnInit } from '@angular/core';
import { UtilisateurDto } from '../api/model/utilisateurDto'; // Assurez-vous que le modèle est bien défini
import { ProfesseurService } from '../services/professeur.service';
import { AuthService } from '../services/auth.service';
import { UtilisateurService } from '../services/utilisateur.service';
import { ProfesseurDto } from '../api';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-professeur',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, TranslateModule],
  templateUrl: './professeur.component.html',
  styleUrls: ['./professeur.component.css']
})
export class ProfesseurComponent implements OnInit {

  username: string = 'Nom d\'utilisateur';
  professors: ProfesseurDto[] = [];

  professeurForm!: FormGroup;
  professeur: ProfesseurDto | null = null;  // Initialisation correcte du professeur
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private fb: FormBuilder,  // Injection du FormBuilder
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private professeurService: ProfesseurService,
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
  }

  ngOnInit() {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
    this.initForm();
    this.loadUserProfile();
    this.loadProfessors();
  }

  // Initialiser le formulaire réactif
  initForm() {
    this.professeurForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateDeNaissance: ['', Validators.required],
    });
  }

  // Modifier la méthode loadProfesseur pour convertir la date au format correct
  loadProfesseur() {
    this.professeurService.getProfesseurById(this.professeur?.idProfesseur!).subscribe(
      (data: ProfesseurDto) => {
        this.professeur = data;
  
        // Convertir la date de naissance au format 'YYYY-MM-DD'
        const dateNaissance = this.convertDateToYYYYMMDD(data.utilisateurDto?.dateDeNaissance);
  
        // Mettre à jour le formulaire avec la date correctement formatée
        this.professeurForm.patchValue({
          nom: data.nom,
          prenom: data.prenom,
          email: data.utilisateurDto?.email,
          dateDeNaissance: dateNaissance // Date formatée au format 'YYYY-MM-DD'
        });
      },
      (error) => {
        console.error('Erreur lors du chargement du professeur', error);
      }
    );
  }
  
  // Fonction pour convertir une date en 'YYYY-MM-DD'
  convertDateToYYYYMMDD(dateString: string | undefined): string | null {
    if (!dateString) return null;
  
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajouter un zéro devant si nécessaire
    const day = String(date.getDate()).padStart(2, '0'); // Ajouter un zéro devant si nécessaire
  
    return `${year}-${month}-${day}`;
  }
  

  // Charger les détails de l'utilisateur connecté
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
      console.error('Email introuvable dans le token.');
      return;
    }

    this.utilisateurService.getUtilisateurByEmail(email).subscribe({
      next: (user: UtilisateurDto) => {
        if (!user.id) {
          console.error('ID utilisateur introuvable.');
          return;
        }

        this.professeurService.getProfesseurByUtilisateurId(user.id).subscribe({
          next: (professeur: ProfesseurDto) => {
            this.professeur = professeur;

            // Convertir la date de naissance au format 'YYYY-MM-DD'
    const dateNaissance = this.convertDateToYYYYMMDD(professeur.utilisateurDto?.dateDeNaissance);


            this.professeurForm.patchValue({
              nom: professeur.nom,
              prenom: professeur.prenom,
              email: professeur.utilisateurDto?.email,
              dateDeNaissance: dateNaissance
            });
          },
          error: (err) => {
            console.error('Erreur lors de la récupération du professeur:', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des informations utilisateur:', err);
      }
    });
  }

  // Charger la liste des professeurs
  loadProfessors() {
    this.professeurService.getAllProfesseurs().subscribe({
      next: (professors: ProfesseurDto[]) => {
        this.professors = professors;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des professeurs:', err);
      }
    });
  }

  // Modifier un professeur
  editProfesseur() {
    if (this.professeurForm.valid) {
        if (!this.professeur) {
            console.error('Professeur non défini');
            return; // Arrêtez l'exécution si professeur est null
        }

        const updatedProfesseur: ProfesseurDto = {
            idProfesseur: this.professeur.idProfesseur!,
            nom: this.professeurForm.value.nom,
            prenom: this.professeurForm.value.prenom,
            utilisateurDto: {
                id: this.professeur.utilisateurDto?.id,
                nom: this.professeurForm.value.nom,
                prenom: this.professeurForm.value.prenom,
                email: this.professeurForm.value.email,
                dateDeNaissance: this.professeurForm.value.dateDeNaissance + "T00:00:00Z",
                photo: this.professeur.utilisateurDto?.photo || '',
                roles: this.professeur.utilisateurDto?.roles,
                professeurNom: this.professeurForm.value.nom,
                professeurPrenom: this.professeurForm.value.prenom,
                motDePasse: undefined
            }
        };

        console.log("Données à envoyer : ", updatedProfesseur);

        this.professeurService.updateProfesseur(this.professeur.idProfesseur!, updatedProfesseur).subscribe(
            response => {
                console.log('Professeur mis à jour avec succès', response);
                this.loadProfesseur();
                // Ouvrir le modal après une mise à jour réussie
                const modal = new(window as any).bootstrap.Modal(document.getElementById('successModalProf'));
                modal.show();
            },
            error => {
                console.error('Erreur lors de la mise à jour du professeur', error);
            }
        );
    } else {
        this.professeurForm.markAllAsTouched();
    }
}

  // Modifier le professeur par ID
  editProfesseurById(id: number | undefined) {
    if (id !== undefined) {
      console.log('Editer le professeur avec ID:', id);
      this.professeurService.getProfesseurById(id).subscribe({
        next: (professeur: ProfesseurDto) => {
          this.professeur = professeur;
          this.professeurForm.patchValue({
            nom: professeur.nom,
            prenom: professeur.prenom,
            email: professeur.utilisateurDto?.email,
            dateDeNaissance: professeur.utilisateurDto?.dateDeNaissance
          });
        },
        error: (err) => {
          console.error('Erreur lors de la récupération du professeur par ID:', err);
        }
      });
    } else {
      console.error('ID du professeur non défini.');
    }
  }

  // Supprimer un professeur
  deleteProfesseur(id: number | undefined) {
    if (id !== undefined) {
      this.professeurService.deleteProfesseur(id).subscribe(() => {
        console.log('Professeur supprimé');
        this.loadProfessors();
      });
    } else {
      console.error('ID du professeur non défini.');
    }
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

  // Méthode appelée à la soumission du formulaire
  onSubmit() {
    this.editProfesseur();
  }
}
