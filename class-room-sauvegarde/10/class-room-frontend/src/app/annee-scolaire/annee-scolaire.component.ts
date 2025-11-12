import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeScolaireService } from '../services/annee-scolaire.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AnneeScolaireDto } from '../api';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-annee-scolaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './annee-scolaire.component.html',
  styleUrls: ['./annee-scolaire.component.css']
})
export class AnneeScolaireComponent implements OnInit {
  anneesScolaires: any[] = [];
  anneeForm!: FormGroup;
  editMode = false;
  selectedAnnee: any = null;
  idToDelete: number | null = null; // Variable pour stocker l'ID à supprimer
  private confirmDeleteModal: any; // Référence au modal de confirmation
  anneeScolaire : AnneeScolaireDto | null = null
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private anneeScolaireService: AnneeScolaireService, 
    private fb: FormBuilder,
    private renderer: Renderer2,
    private authService: AuthService,
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
  }

  ngOnInit(): void {

    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);

    //this.loadAnneesScolaires();
    this.loadAnneeScolaire();
    this.anneeForm = this.fb.group({
      libelle: [''],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required]
    }, { validators: this.dateValidator });

    // Met à jour le libellé lors des changements de dates
    this.anneeForm.get('dateDebut')?.valueChanges.subscribe(() => this.updateLibelle());
    this.anneeForm.get('dateFin')?.valueChanges.subscribe(() => this.updateLibelle());

    // Initialiser la référence au modal de confirmation
    const confirmDeleteModalElement = document.getElementById('confirmDeleteModal');
    if (confirmDeleteModalElement) {
      this.confirmDeleteModal = new (window as any).bootstrap.Modal(confirmDeleteModalElement);
    }
  }

  dateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const dateDebut = control.get('dateDebut')?.value;
    const dateFin = control.get('dateFin')?.value;
    if (dateDebut && dateFin && new Date(dateFin) <= new Date(dateDebut)) {
      return { dateInvalid: true };
    }
    return null;
  };

  loadAnneesScolaires() {
    this.anneeScolaireService.findAll().subscribe(
      (data: any[]) => {
        this.anneesScolaires = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des années scolaires', error);
      }
    );
  }

  onSubmit() {
    if (this.anneeForm.valid) {
      if (this.editMode) {
        this.updateAnnee();
      } else {
        this.addAnnee();
      }
    } else {
      this.anneeForm.markAllAsTouched(); // Marque tous les contrôles comme touchés pour afficher les messages d'erreur
    }
  }

  addAnnee() {
    const newAnnee = this.anneeForm.value;
    this.anneeScolaireService.create(newAnnee).subscribe(
      (response) => {
        this.resetForm();
        this.loadAnneesScolaires();
        this.showSuccessModal(); // Afficher le modal de succès
      },
      (error) => {
        console.error('Erreur lors de l\'ajout de l\'année scolaire', error);
      }
    );
  }

  editAnnee(annee: any) {
    this.editMode = true;
    this.selectedAnnee = annee;
    this.anneeForm.patchValue(annee);
  }

  updateAnnee() {
    const updatedAnnee = this.anneeForm.value;
    console.log('Mise à jour de l\'année avec les valeurs : ', updatedAnnee); // Ajout de log pour déboguer
    
    this.anneeScolaireService.update(this.selectedAnnee.idAnneeScolaire, updatedAnnee).subscribe(
      (response) => {
        this.resetForm();
        this.loadAnneeScolaire();
        this.showSuccessModal(); // Afficher le modal de succès
      },
      (error) => {
        console.error('Erreur lors de la mise à jour de l\'année scolaire', error);
      }
    );
  }
  

  deleteAnnee(id: number) {
    this.idToDelete = id; // Stocker l'ID pour la suppression
    this.showConfirmDeleteModal(); // Afficher le modal de confirmation
  }

  showConfirmDeleteModal() {
    if (this.confirmDeleteModal) {
      this.confirmDeleteModal.show();
    }
  }

  confirmDelete() {
    if (this.idToDelete !== null) {
      this.anneeScolaireService.delete(this.idToDelete).subscribe(
        () => {
          this.loadAnneesScolaires();
          this.showSuccessModal(); // Afficher le modal de succès
          this.closeConfirmDeleteModal(); // Fermer le modal de confirmation
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'année scolaire', error);
        }
      );
    }
    this.idToDelete = null; // Réinitialiser l'ID après suppression
  }

  closeConfirmDeleteModal() {
    if (this.confirmDeleteModal) {
      this.confirmDeleteModal.hide();
    }
  }

  resetForm() {
    this.anneeForm.reset({
      libelle: '', 
      dateDebut: '', 
      dateFin: ''
    });
    this.editMode = false;
    this.selectedAnnee = null;
  }
  

  updateLibelle() {
    const dateDebut = this.anneeForm.get('dateDebut')?.value;
    const dateFin = this.anneeForm.get('dateFin')?.value;
    
    if (dateDebut && dateFin) {
      const yearDebut = new Date(dateDebut).getFullYear();
      const yearFin = new Date(dateFin).getFullYear();
      const libelle = `${yearDebut}-${yearFin}`;
      this.anneeForm.patchValue({ libelle: libelle }, { emitEvent: false }); // Mise à jour sans déclencher d'événement
    }
}
  showSuccessModal() {
    const modalElement = document.getElementById('successModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  loadAnneeScolaire() {
    const anneeScolaireId = this.authService.getAnneeScolaireId();
    if (anneeScolaireId) {
      this.anneeScolaireService.findById(anneeScolaireId).subscribe({
        next: (anneeScolaire) => {
          //this.anneeScolaire = anneeScolaire.libelle ?? 'Année scolaire non spécifiée';
          this.anneeScolaire = anneeScolaire
          this.anneeForm.patchValue({
            libelle: anneeScolaire.libelle,
            dateDebut: anneeScolaire.dateDebut,
            dateFin: anneeScolaire.dateFin
          })
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'année scolaire:', err);
        }
      });
    }
  }
}
