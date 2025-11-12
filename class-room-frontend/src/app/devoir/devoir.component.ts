import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AnneeScolaireDto,
  DevoirDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  PeriodeDto,
  ProfesseurDto,
} from '../api';
import { DevoirService } from '../services/devoir.service';
import { PeriodeService } from '../services/periode.service';
import { UserProfileService } from '../services/user-profile-service.service';
import { Observable, of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';


@Component({
  selector: 'app-devoir',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './devoir.component.html',
  styleUrl: './devoir.component.css',
})
export class DevoirComponent implements OnInit {
  devoirForm: FormGroup;
  devoirs: DevoirDto[] = [];
  //periodes: PeriodeDto[] = [];
  editingDevoirId: number | null = null;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public periodes$ = new BehaviorSubject<PeriodeDto[]>([]);
  periodId!: number;
  devoirs$: Observable<DevoirDto[]> | undefined; // Observable pour les devoirs
  isEditing: boolean = false;
  currentDevoir: DevoirDto | null = null;
  @ViewChild('successModalDevoir') successModal!: TemplateRef<any>; // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalDevoir') confirmDeleteModal!: TemplateRef<any>;
  successMessage: string = '';
  devoirToDelete: DevoirDto | null = null;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private devoirService: DevoirService,
    private periodeService: PeriodeService,
    private modalService: NgbModal, // Injecter NgbModal
  ) {
    this.devoirForm = this.fb.group({
      libelle: ['', Validators.required],
      type: ['', Validators.required],
      coefficient: [0, [Validators.required, Validators.min(1)]],
      periode: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPeriodes();
    //this.loadDevoirsByPeriode();
  }

  private loadUserProfile() {
    this.userProfileService.loadUserProfile().subscribe({
      next: (professeur) => {
        this.professeur = professeur;
        this.loadEtablissement();
      },
      error: console.error,
    });
  }

  private loadEtablissement(): void {
    this.userProfileService.loadEtablissement().subscribe({
      next: (etablissement) => {
        this.etablissement = etablissement;
        this.loadAnneeScolaire();
      },
      error: console.error,
    });
  }

  private loadAnneeScolaire(): void {
    this.userProfileService.loadAnneeScolaire().subscribe({
      next: (anneeScolaire) => {
        this.anneeScolaire = anneeScolaire;
        this.fetchEtablissementProfesseur();
      },
      error: console.error,
    });
  }

  private fetchEtablissementProfesseur(): void {
    if (this.professeur && this.etablissement && this.anneeScolaire) {
      this.userProfileService
        .fetchEtablissementProfesseur(
          this.professeur.idProfesseur!,
          this.etablissement.idEtablissement!,
          this.anneeScolaire.idAnneeScolaire!
        )
        .subscribe({
          next: (etablissementProfesseur) => {
            this.etablissementProfesseur = etablissementProfesseur;
            this.loadPeriodes();
          },
          error: console.error,
        });
    }
  }

  loadPeriodes(): void {
    if (this.etablissementProfesseur?.idEtablissementProfesseur) {
      this.periodeService
        .getPeriodesByEtablissementProfesseurId(
          this.etablissementProfesseur.idEtablissementProfesseur
        )
        .subscribe({
          next: (periodes) => {
            this.periodes$.next(periodes);
            // Vérifiez si la première période a un ID valide avant de charger les devoirs
            const firstPeriode = periodes[0];
            if (firstPeriode && firstPeriode.idPeriode !== undefined) {
              this.loadDevoirsByPeriode(firstPeriode.idPeriode);
            }
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des périodes', err);
          },
        });
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }

  // Méthode pour charger les devoirs selon l'ID de la période
  loadDevoirsByPeriode(periodeId: number): void {
    if (periodeId) {
      this.devoirs$ = this.devoirService.getDevoirsByPeriodeId(periodeId);
    } else {
      console.error('Période ID invalide.');
    }
  }

  onPeriodeChange(): void {
    const selectedValue = this.devoirForm.get('periode')?.value;

    if (selectedValue === 'all') {
      // Charger tous les devoirs de toutes les périodes
      this.loadAllDevoirs();
    } else {
      // Charger les devoirs pour la période sélectionnée
      this.loadDevoirsByPeriode(selectedValue);
    }
  }
  loadAllDevoirs(): void {
    this.devoirService.getAllDevoirs().subscribe({
      next: (devoirs) => {
        this.devoirs$ = of(devoirs); // Utilisez 'of' pour créer un Observable à partir du tableau
      },
      error: (err) => {
        console.error(
          'Erreur lors de la récupération de tous les devoirs',
          err
        );
      },
    });
  }
  // Soumettre le formulaire pour ajouter/modifier un devoir
  onSubmit(): void {
    if (this.devoirForm.valid && this.currentDevoir) {
      const devoirData: DevoirDto = {
        idDevoir: this.currentDevoir?.idDevoir,
        libelle: this.devoirForm.get('libelle')?.value, // Get 'libelle' value
        coefficient: this.devoirForm.get('coefficient')?.value,
        type: this.devoirForm.get('type')?.value,
        periode: this.currentDevoir.periode,
      };
      console.log(devoirData);
      if (this.isEditing) {
        // Logique pour modifier le devoir
        this.devoirService.createDevoir(devoirData).subscribe(() => {
          this.loadDevoirsByPeriode(this.devoirForm.get('periode')?.value);
          this.resetForm();
          this.showSuccessModal("Devoir modifier");
        });
      }
    } else {
      const idPeriode = this.devoirForm.get('periode')?.value;
      console.log("id periode"+idPeriode)
      if (idPeriode) {
        this.periodeService.getPeriodeById(idPeriode).subscribe({
          next: (periode) => {
            const devoirData: DevoirDto = {
              libelle: this.devoirForm.get('libelle')?.value, // Get 'libelle' value
              coefficient: this.devoirForm.get('coefficient')?.value,
              type: this.devoirForm.get('type')?.value,
              periode: periode, // Utiliser l'objet Période récupéré
            };
            console.log(devoirData)
            // Maintenant, vous pouvez utiliser devoirData pour l'ajout ou la mise à jour
            this.devoirService.createDevoir(devoirData).subscribe(() => {
              this.loadDevoirsByPeriode(this.devoirForm.get('periode')?.value);
              this.showSuccessModal("Devoir enregistrer");
              this.resetForm();
            });;
          },
          error: (err) => {
            console.error('Erreur lors de la récupération de la période', err);
          },
        });
      } else {
        console.error('ID de période invalide.');
      }
    }
  }

  resetForm(): void {
    this.devoirForm.reset();
    this.isEditing = false;
    this.currentDevoir = null;
  }

  // Remplir le formulaire pour modifier un devoir existant
  editDevoir(devoir: DevoirDto): void {
    this.currentDevoir = devoir;

    // Remplir le formulaire avec les données du devoir
    this.devoirForm.patchValue(devoir);

    // Assurez-vous que la période est sélectionnée
    this.devoirForm.get('periode')?.setValue(devoir.periode?.idPeriode);

    this.isEditing = true;
  }

  deleteDevoir(){
    if (this.devoirToDelete) {
      this.devoirService.deleteDevoirById(this.devoirToDelete.idDevoir!).subscribe(() => {
        this.loadDevoirsByPeriode(this.devoirToDelete?.periode?.idPeriode!);
        this.onPeriodeChange();
        this.modalService.dismissAll();
      });
    }

  }

  // Supprimer un devoir
  confirmDelete(devoir : DevoirDto) {
    this.devoirToDelete = devoir;
    this.modalService.open(this.confirmDeleteModal, {
      ariaLabelledBy: 'confirmDeleteModalLabel',
    });
    }

  // Réinitialiser le formulaire
  clearForm() {
    this.editingDevoirId = null;
    this.devoirForm.reset();
  }

  showSuccessModal(message: string): void {
    this.successMessage = message; // Assigne le message à la propriété
    const modalRef = this.modalService.open(this.successModal); // Utilise le template
  }
}
