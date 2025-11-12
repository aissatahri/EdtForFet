import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtablissementDto } from '../api';
import { EtablissementService } from '../services/etablissement.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-etablissement',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './etablissement.component.html',
  styleUrl: './etablissement.component.css'
})
export class EtablissementComponent implements OnInit {

  etablissementForm!: FormGroup;
  etablissements: EtablissementDto[] = [];
  etablissement: EtablissementDto | null = null;
  instut: string = '';  // Nom de l'établissement

  @ViewChild('successModal') successModal!: ElementRef;  // Pour accéder à la modale
  currentLang: string = 'fr'; // Langue par défaut

  constructor(
    private fb: FormBuilder,
    private etablissementService: EtablissementService,
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
    this.initForm();
    this.loadEtablissement()
  }

  // Initialisation du formulaire réactif
  initForm() {
    this.etablissementForm = this.fb.group({
      libelle: ['', Validators.required],
      telephone: ['', Validators.required],
      adresse: ['', Validators.required]
    });
  }

  // Charger tous les établissements
  loadEtablissements() {
    this.etablissementService.findAll().subscribe({
      next: (etablissements: EtablissementDto[]) => {
        this.etablissements = etablissements;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des établissements :', err);
      }
    });
  }

  // Méthode pour soumettre le formulaire et ajouter ou modifier un établissement
  onSubmit() {
    if (this.etablissementForm.valid && this.etablissement) {
      const etablissementData = this.etablissementForm.value;
      // Modification de l'établissement existant
      this.etablissementService.updateEtablissement(this.etablissement.idEtablissement!, etablissementData)
        .subscribe({
          next: () => {
            console.log('Établissement mis à jour avec succès');
            this.loadEtablissement(); // Recharger les données
            this.showSuccessModal(); // Afficher la modale de succès
          },
          error: (err) => console.error('Erreur lors de la mise à jour de l\'établissement :', err)
        });
    } else {
      this.etablissementForm.markAllAsTouched();
    }
  }

  // Editer un établissement par ID
  editEtablissementById(id: number | undefined) {
    if (id !== undefined) {
      this.etablissementService.getEtablissementById(id).subscribe({
        next: (etablissement: EtablissementDto) => {
          this.etablissement = etablissement;
          this.etablissementForm.patchValue(etablissement);
        },
        error: (err) => console.error('Erreur lors de la récupération de l\'établissement par ID :', err)
      });
    }
    
  }

  // Supprimer un établissement
  deleteEtablissement(id: number | undefined) {
    if (id !== undefined) {
      this.etablissementService.deleteEtablissement(id).subscribe({
        next: () => {
          console.log('Établissement supprimé');
          this.loadEtablissements();
        },
        error: (err) => console.error('Erreur lors de la suppression de l\'établissement :', err)
      });
    }
    
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.etablissement = null;
    this.etablissementForm.reset();
  }

  loadEtablissement() {
    const etablissementId = this.authService.getEtablissementId();
    if (etablissementId) {
      this.etablissementService.getEtablissementById(etablissementId).subscribe({
        next: (etablissement) => {
          this.instut = etablissement.libelle ?? 'Établissement non spécifié';
          this.etablissement = etablissement
          this.etablissementForm.patchValue({
            libelle: etablissement.libelle,
            adresse: etablissement.adresse,
            telephone: etablissement.telephone
          })


        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'établissement:', err);
        }
      });
    }
  }

  // Afficher la modale de succès après la mise à jour
  showSuccessModal() {
    // Ouvrir le modal après une mise à jour réussie
    const modal = new(window as any).bootstrap.Modal(document.getElementById('successModalIns'));
    modal.show();
  }
}
