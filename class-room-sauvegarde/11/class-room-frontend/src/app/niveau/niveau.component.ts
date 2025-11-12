import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UtilisateurService } from '../services/utilisateur.service';
import { ProfesseurService } from '../services/professeur.service';
import {
  AnneeScolaireDto,
  NiveauDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  ProfesseurDto,
  NiveauService,
  ClasseDto,
  ClasseService,
  SousClasseDto,
} from '../api';
import { UserProfileService } from '../services/user-profile-service.service';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClasseComponent } from '../classe/classe.component';
import { SousclasseService } from '../services/sousclasse.service';

@Component({
  selector: 'app-niveau',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClasseComponent],
  templateUrl: './niveau.component.html',
  styleUrl: './niveau.component.css',
})
export class NiveauComponent implements OnInit {
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  niveauForm!: FormGroup;
  editForm!: FormGroup;
  niveaux$!: Observable<NiveauDto[]>;
  isEditing = false;
  showClasse = false;
  successMessage = '';
  selectedNiveau: NiveauDto | null = null;

  @ViewChild('successModalNiveau', { static: true })
  successModalNiveau!: TemplateRef<any>;
  @ViewChild('confirmDeleteModalNiveau', { static: true })
  confirmDeleteModalNiveau!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private niveauService: NiveauService,
    private classeService: ClasseService,
    private sousclasseService: SousclasseService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForm();
    this.loadNiveaux();
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
            this.loadNiveaux();
          },
          error: console.error,
        });
    }
  }

  // Initialisation du formulaire principal
  initForm(): void {
    this.niveauForm = this.fb.group({
      niveau: this.fb.array([]),
    });
    this.editForm = this.fb.group({
      libelle: ['', Validators.required],
    });
  }

  // Charger la liste des niveaux
  loadNiveaux(): void {
    this.niveaux$ = this.niveauService.findAll5();
    if (this.etablissementProfesseur?.idEtablissementProfesseur) {
      console.log(this.etablissementProfesseur.idEtablissementProfesseur);
      this.niveaux$ = this.niveauService.findByEtablissementProfesseurId1(
        this.etablissementProfesseur.idEtablissementProfesseur
      );
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }

  // Récupérer la FormArray des niveaux
  get niveau(): FormArray {
    return this.niveauForm.get('niveau') as FormArray;
  }

  getClasses(niveau: AbstractControl): FormArray {
    return niveau.get('classe') as FormArray;
  }

  // Ajouter un niveau au formulaire
  addNiveau(): void {
    const niveauGroup = this.fb.group({
      libelle: ['', Validators.required],
      nombreClasse: [0, [Validators.required, Validators.min(1)]],
      isGroupe: [false],
      nbGroupe: [{ value: 0, disabled: true }, [Validators.min(0)]], // Initialement désactivé
      classe: this.fb.array([]),
    });

    // Ajouter le niveau à la FormArray
    this.niveau.push(niveauGroup);

    // Appeler la méthode pour observer les changements de 'isGroupe'
    this.syncGroupeControl(niveauGroup);
  }

  // Supprimer un niveau du formulaire
  removeNiveau(index: number): void {
    this.niveau.removeAt(index);
  }

  get niveaux(): FormArray {
    return this.niveauForm.get('niveaux') as FormArray;
  }

  // Soumettre le formulaire
  onSubmit(): void {
    if (this.niveauForm.valid) {
      let totalClasse = 0;
      let totalNiveau = 0;
      let totalSousClasse = 0; // Counter for sous classes
      const niveauData: NiveauDto[] = this.niveau.controls.map((niveau) => ({
        libelle: niveau.value.libelle!,
        etablissementProfesseur: this.etablissementProfesseur!,
      }));

      niveauData.forEach((niveau, index) => {
        this.niveauService.save5(niveau).subscribe({
          next: (createdNiveau) => {
            console.log('Niveau créée avec succès:', createdNiveau);
            totalNiveau++; // Increment the level counter

            const nombreClasses =
              this.niveau.at(index).get('nombreClasse')?.value || 0; // Get the number of classes
            const isGroupe =
              this.niveau.at(index).get('isGroupe')?.value || false; // Check if it's a group
            const nombreDeGroupes =
              this.niveau.at(index).get('nbGroupe')?.value || 0; // Get the number of groups from the control

            // Loop to create each class
            for (let i = 0; i < nombreClasses; i++) {
              const classeData: ClasseDto = {
                libelle: createdNiveau.libelle + `-${i + 1}`,
                nombreEleve: 30,
                niveau: createdNiveau,
              };
              console.log(classeData);
              this.classeService.save12(classeData).subscribe({
                next: (classeData) => {
                  console.log('Classe créée avec succès:', classeData);
                  totalClasse++; // Increment the class counter
                  // Check if it's a group and create sous classes
                  if (isGroupe) {
                    for (let j = 0; j < nombreDeGroupes; j++) {
                      let nombreEleve: number;

                      // Calculate the number of students per group based on the total number of students in the class
                      if (classeData.nombreEleve! % 2 === 0) {
                        // Even number of students in class
                        nombreEleve = classeData.nombreEleve! / 2;
                      } else {
                        // Odd number of students in class
                        if (j === 0) {
                          nombreEleve = Math.ceil(classeData.nombreEleve! / 2); // First group gets the extra student
                        } else {
                          nombreEleve = Math.floor(classeData.nombreEleve! / 2); // Subsequent groups get half
                        }
                      }
                      const sousClasseData: SousClasseDto = {
                        libelle: `${classeData.libelle} G- ${j + 1}`, // Naming for each group
                        nombreEleve: nombreEleve, // You can customize this as needed
                        classe: classeData,
                      };
                      this.sousclasseService
                        .addSousClasse(sousClasseData)
                        .subscribe({
                          next: (sousClasseData) => {
                            console.log(
                              'Sous classe créée avec succès:',
                              sousClasseData
                            );
                            totalSousClasse++; // Increment the sous class counter
                          },
                          error: (error) => {
                            console.error(
                              'Erreur lors de la création de la sous classe:',
                              error
                            );
                          },
                        });
                    }
                  }
                },
                error: (error) => {
                  console.error(
                    'Erreur lors de la création de la classe:',
                    error
                  );
                },
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la création du niveau:', error);
          },
        });
      });

      // Display results in a modal after creating all levels, classes, and subclasses
      setTimeout(() => {
        const message = `Niveaux créées: ${totalNiveau}\nClasses créées: ${totalClasse}\nSous classes créées: ${totalSousClasse}\n`;
        this.showSuccessModal(message);
        this.loadNiveaux();
        this.resetForm();
      }, 1000); // A slight delay to ensure all subscriptions are complete
    }
  }

  showSuccessModal(message: string): void {
    this.successMessage = message; // Assigne le message à la propriété
    const modalRef = this.modalService.open(this.successModalNiveau); // Utilise le template
  }

  resetForm(): void {
    this.niveau.clear(); // Vider toutes les périodes du FormArray
    this.niveauForm.reset();
    this.selectedNiveau = null;
  }
  // Charger les informations d'un niveau pour édition
  editNiveau(niveau: NiveauDto): void {
    this.isEditing = true;
    this.selectedNiveau = niveau;
    this.editForm.patchValue(niveau);
  }

  // Mettre à jour un niveau existant
  onUpdate(): void {
    console.log('on update');

    if (this.editForm.valid) {
      console.log('on update 01');
      const niveauData: NiveauDto = {
        idNiveau: this.selectedNiveau?.idNiveau, // Keep the existing ID, if applicable
        libelle: this.editForm.get('libelle')?.value, // Get 'libelle' value
        etablissementProfesseur: this.selectedNiveau?.etablissementProfesseur, // Assuming it's not modified here
      };
      console.log(niveauData);
      this.niveauService.save5(niveauData).subscribe((response) => {
        // Gestion de la réponse, réinitialiser le formulaire, etc.
        this.isEditing = false;
        this.selectedNiveau = null;
        this.niveauForm.reset();
        this.showSuccessModal('mise a jour a bien effectuee');
        this.loadNiveaux();
      });
    }
  }

  // Annuler l'édition
  cancelEdit(): void {
    this.isEditing = false;
    this.editForm.reset();
  }

  // Confirmer la suppression d'un niveau
  confirmDeleteNiveau(niveau: NiveauDto): void {
    const modalRef = this.modalService.open(this.confirmDeleteModalNiveau);
    modalRef.result.then(
      () => this.deleteNiveau(niveau),
      () => {}
    );
  }

  // Supprimer un niveau
  deleteNiveau(niveau: NiveauDto): void {
    this.niveauService.delete5(niveau.idNiveau!).subscribe(() => {
      this.successMessage = 'Niveau supprimé avec succès.';
      this.modalService.open(this.successModalNiveau);
      this.loadNiveaux(); // Recharger les niveaux après suppression
    });
  }

  // Afficher ou cacher les classes associées
  toggleClasse(): void {
    this.showClasse = !this.showClasse;
  }

  syncGroupeControl(niveauGroup: FormGroup): void {
    const isGroupeControl = niveauGroup.get('isGroupe');
    const nbGroupeControl = niveauGroup.get('nbGroupe');

    // Observer les changements de la case à cocher 'isGroupe'
    isGroupeControl?.valueChanges.subscribe((isChecked: boolean) => {
      if (isChecked) {
        nbGroupeControl?.enable(); // Activer le champ 'nbGroupe' si 'isGroupe' est coché
      } else {
        nbGroupeControl?.disable(); // Désactiver sinon
        nbGroupeControl?.setValue(0); // Remettre à zéro si désactivé
      }
    });
  }
}
