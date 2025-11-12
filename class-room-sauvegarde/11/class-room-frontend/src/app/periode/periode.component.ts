import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AnneeScolaireDto, EtablissementDto, EtablissementProfesseurDto, PeriodeDto, ProfesseurDto, UtilisateurDto} from '../api';
import { PeriodeService } from '../services/periode.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { UtilisateurService } from '../services/utilisateur.service';
import { ProfesseurService } from '../services/professeur.service';
import { EtablissementService } from '../services/etablissement.service';
import { AnneeScolaireService } from '../services/annee-scolaire.service';
import { EtablissementProfesseurService } from '../services/etablissementprofesseur.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Importer NgbModal


@Component({
  selector: 'app-periode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './periode.component.html',
  styleUrl: './periode.component.css'
})
export class PeriodeComponent implements OnInit {
  periodeForm!: FormGroup;
  periodes$: Observable<PeriodeDto[]> | undefined;
  selectedPeriode: PeriodeDto | null = null;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  successMessage: string = '';
  periodeToDelete: PeriodeDto | null = null;
  @ViewChild('successModalPeriode') successModal!: TemplateRef<any>; // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalPeriode') confirmDeleteModal!: TemplateRef<any>;


  constructor(
    private periodeService: PeriodeService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private professeurService: ProfesseurService,
    private etablissementService: EtablissementService,
    private anneeScolaireService: AnneeScolaireService,
    private etablissementProfesseurService: EtablissementProfesseurService,
    private modalService: NgbModal // Injecter NgbModal
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserProfile();
    this.loadPeriodes();
  }

  initializeForm(): void {
    this.periodeForm = this.formBuilder.group({
      idPeriode: [''],
      libelle: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
    });
  }

  loadPeriodes(): void {
    if (this.etablissementProfesseur && this.etablissementProfesseur.idEtablissementProfesseur) {
      console.log(this.etablissementProfesseur.idEtablissementProfesseur);
      this.periodes$ = this.periodeService.getPeriodesByEtablissementProfesseurId(this.etablissementProfesseur.idEtablissementProfesseur);
    } else {
      console.error('EtablissementProfesseur est vide ou l\'ID est invalide.');
    }
  }

  createOrUpdatePeriode(): void {
    const periode: PeriodeDto = this.periodeForm.value;
  
    if (this.etablissementProfesseur) {
      periode.etablissementProfesseur = this.etablissementProfesseur;
  
      if (periode.idPeriode) {
        this.periodeService.savePeriode(periode).subscribe(() => {
          this.loadPeriodes();
          this.resetForm();
          this.showSuccessModal('Période mise à jour avec succès.');
        });
      } else {
        this.periodeService.savePeriode(periode).subscribe(() => {
          this.loadPeriodes();
          this.resetForm();
          this.showSuccessModal('Période créée avec succès.');
        });
      }
    } else {
      console.error('Établissement Professeur non défini, impossible de sauvegarder la période.');
    }
  }
  
  

  editPeriode(periode: PeriodeDto): void {
    this.selectedPeriode = periode;
    this.periodeForm.patchValue(periode);
  }

  deletePeriode(): void {
    if (this.periodeToDelete) {
      this.periodeService.deletePeriode(this.periodeToDelete.idPeriode!).subscribe(() => {
        this.loadPeriodes();
        this.modalService.dismissAll();
      });
    }
  }

  resetForm(): void {
    this.periodeForm.reset();
    this.selectedPeriode = null;
  }

  loadUserProfile(): void {
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

    this.utilisateurService.getUtilisateurByEmail(email).subscribe({
      next: (user: UtilisateurDto) => {
        if (!user.id) {
          console.error('ID utilisateur introuvable.');
          return;
        }

        this.professeurService.getProfesseurByUtilisateurId(user.id).subscribe({
          next: (professeur: ProfesseurDto) => {
            this.professeur = professeur;
            this.loadEtablissement(); // Charger établissement après la récupération du professeur
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

  loadEtablissement(): void {
    const etablissementId = this.authService.getEtablissementId();
    if (etablissementId) {
      this.etablissementService.getEtablissementById(etablissementId).subscribe({
        next: (etablissement: EtablissementDto) => {
          this.etablissement = etablissement;
          this.loadAnneeScolaire(); // Charger année scolaire après la récupération de l'établissement
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'établissement:', err);
        }
      });
    }
  }

  loadAnneeScolaire(): void {
    const anneeScolaireId = this.authService.getAnneeScolaireId();
    if (anneeScolaireId) {
      this.anneeScolaireService.findById(anneeScolaireId).subscribe({
        next: (anneeScolaire: AnneeScolaireDto) => {
          this.anneeScolaire = anneeScolaire;
          this.fetchEtablissementProfesseur(); // Charger EtablissementProfesseur après l'année scolaire
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'année scolaire:', err);
        }
      });
    }
  }

  fetchEtablissementProfesseur(): void {
    if (this.professeur && this.etablissement && this.anneeScolaire) {
      this.etablissementProfesseurService.findByProfesseurAndEtablissementAndAnneeScolaire(
        this.professeur.idProfesseur!,
        this.etablissement.idEtablissement!,
        this.anneeScolaire.idAnneeScolaire!
      ).subscribe({
        next: (etablissementProfesseur: EtablissementProfesseurDto) => {
          this.etablissementProfesseur = etablissementProfesseur;
          console.log('Établissement Professeur récupéré:', this.etablissementProfesseur);
          this.loadPeriodes(); // Charger les périodes après la récupération d'etablissementProfesseur
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'établissement professeur:', err);
        }
      });
    }
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

  showSuccessModal(message: string): void {
    this.successMessage = message; // Assigne le message à la propriété
    const modalRef = this.modalService.open(this.successModal); // Utilise le template
  }

  confirmDeletePeriode(periode: PeriodeDto): void {
    this.periodeToDelete = periode;
    this.modalService.open(this.confirmDeleteModal, { ariaLabelledBy: 'confirmDeleteModalLabel' }); // Utilise le template
  }
}
