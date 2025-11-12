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
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateur.service';
import { ProfesseurService } from '../../services/professeur.service';
import {
  AnneeScolaireDto,
  DevoirDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  PeriodeDto,
  ProfesseurDto,
} from '../../api';
import { UserProfileService } from '../../services/user-profile-service.service';
import { DevoirService } from '../../services/devoir.service';
import { PeriodeService } from '../../services/periode.service';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DevoirComponent } from "../../devoir/devoir.component"; // Importer NgbModal

@Component({
  selector: 'app-create-periode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DevoirComponent],
  templateUrl: './create-periode.component.html',
  styleUrl: './create-periode.component.css',
})
export class CreatePeriodeComponent implements OnInit {
  periodeForm!: FormGroup;
  editForm!: FormGroup;
  isEditing: boolean = false;
  selectedPeriode: PeriodeDto | null = null;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  periodes$: Observable<PeriodeDto[]> | undefined;
  successMessage: string = '';
  periodeToDelete: PeriodeDto | null = null;
  showDevoir: boolean = false; // Flag to control visibility

  selectedPeriodeDetails: {
    libelle: string;
    dateDebut: string;
    dateFin: string;
  } | null = null;
  @ViewChild('successModalPeriode') successModal!: TemplateRef<any>; // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalPeriode') confirmDeleteModal!: TemplateRef<any>;

  constructor(
    private formBuilder: FormBuilder,
    private userProfileService: UserProfileService,
    private devoirService: DevoirService, // Injecter DevoirService
    private periodeService: PeriodeService,
    private modalService: NgbModal, // Injecter NgbModal
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      libelle: [''],
      dateDebut: [''],
      dateFin: [''],
      nombreDevoir: [0],
      coefDevoir: [0],
      isActivity: [false],
      coefActivity: [0]
    });
  }
  ngOnInit(): void {
    this.periodeForm = this.formBuilder.group({
      libelle: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      etablissementProfesseur: [null], // Ou ajustez selon votre besoin
    });
    this.periodeForm = this.formBuilder.group({
      periodes: this.formBuilder.array([]), // Initialisation du FormArray
    });
    this.loadUserProfile();
    this.loadPeriodes();
  }

  getDevoirs(periode: AbstractControl): FormArray {
    return periode.get('devoirs') as FormArray;
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
      console.log(this.etablissementProfesseur.idEtablissementProfesseur);
      this.periodes$ =
        this.periodeService.getPeriodesByEtablissementProfesseurId(
          this.etablissementProfesseur.idEtablissementProfesseur
        );
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }

  get periodes(): FormArray {
    return this.periodeForm.get('periodes') as FormArray;
  }

  addPeriode() {
    const periodesCount = this.periodes.length;
    let dateDebutDefault = '';
    let dateFinDefault = '';
    let libelleDefault = '';

    if (periodesCount === 0) {
      dateDebutDefault =
        this.etablissementProfesseur?.anneeScolaire?.dateDebut || '';
      dateFinDefault =
        this.etablissementProfesseur?.anneeScolaire?.dateFin || '';
    } else if (periodesCount === 1) {
      const firstDate = new Date(
        this.etablissementProfesseur?.anneeScolaire?.dateDebut || ''
      );
      const year =
        firstDate.getFullYear() + (firstDate.getMonth() >= 8 ? 1 : 0);
      const lastSundayJanuary = this.getLastSundayOfJanuary(year);

      dateDebutDefault =
        this.etablissementProfesseur?.anneeScolaire?.dateDebut || '';
      dateFinDefault =
        lastSundayJanuary > firstDate
          ? this.formatDate(lastSundayJanuary)
          : this.formatDate(new Date(year + 1, 0, 31));
    } else if (periodesCount === 2) {
      libelleDefault = `Semestre ${periodesCount + 1}`;
    } else if (periodesCount >= 3) {
      libelleDefault = `Trimestre ${periodesCount - 1}`;
    }

    const periodeGroup = this.formBuilder.group({
      libelle: [libelleDefault, Validators.required],
      dateDebut: [dateDebutDefault, Validators.required],
      dateFin: [dateFinDefault, Validators.required],
      nombreDevoir: [0, Validators.required],
      coefDevoir: [0, Validators.required],
      isActivity: [false],
      coefActivity: [{ value: 0, disabled: true }],
      devoirs: this.formBuilder.array([]), // Ajout d'un FormArray pour les devoirs
    });

    this.periodes.push(periodeGroup);
    this.adjustPeriodes(); // Ajuster les dates des périodes
    this.updateLibelles(); // Mettre à jour les libellés

    this.generateDevoirs(periodeGroup); // Générer les devoirs

    // Écouteurs pour synchroniser les valeurs des champs entre toutes les périodes
    this.syncFieldAcrossPeriods('nombreDevoir');
    this.syncFieldAcrossPeriods('coefDevoir');
    this.syncFieldAcrossPeriods('isActivity', true); // Passer true pour checkbox
  }

  // Méthode pour générer les devoirs
  generateDevoirs(periodeGroup: FormGroup) {
    const nombreDevoir = periodeGroup.get('nombreDevoir')?.value;
    const coefDevoir = periodeGroup.get('coefDevoir')?.value;

    // Effacer les devoirs précédents
    const devoirsArray = periodeGroup.get('devoirs') as FormArray;
    devoirsArray.clear();

    if (nombreDevoir > 0) {
      const coeffParDevoir = coefDevoir / nombreDevoir; // Calcul du coefficient par devoir
      for (let i = 1; i <= nombreDevoir; i++) {
        const devoirGroup = this.formBuilder.group({
          libelle: [`Devoir ${i}`],
          type: [DevoirDto.TypeEnum.Control],
          coefficient: [coeffParDevoir],
          periode: [periodeGroup], // Référence à la période
        });
        devoirsArray.push(devoirGroup);
        console.log(devoirsArray);
      }

      // Ajouter une activité si isActivity est coché
      if (periodeGroup.get('isActivity')?.value) {
        const activityGroup = this.formBuilder.group({
          libelle: ['Activity'],
          type: [DevoirDto.TypeEnum.Activity],
          coefficient: [periodeGroup.get('coefActivity')?.value || 0],
          periode: [periodeGroup], // Référence à la période
        });
        devoirsArray.push(activityGroup);
        console.log(devoirsArray);
      }
    }
  }

  updateLibelles() {
    const periodesCount = this.periodes.length;

    for (let i = 0; i < periodesCount; i++) {
      const periode = this.periodes.at(i);
      if (periodesCount === 2) {
        periode.get('libelle')?.setValue(`Semestre ${i + 1}`);
      } else if (periodesCount >= 3) {
        periode.get('libelle')?.setValue(`Trimestre ${i + 1}`);
      } else {
        periode.get('libelle')?.setValue(''); // Laisser vide pour une ou zéro période
      }
    }
  }

  private getDefaults(count: number) {
    let dateDebut = '',
      dateFin = '',
      libelle = '';

    if (count === 0) {
      dateDebut = this.etablissementProfesseur?.anneeScolaire?.dateDebut || '';
      dateFin = this.etablissementProfesseur?.anneeScolaire?.dateFin || '';
    } else if (count === 1) {
      const firstDate = new Date(
        this.etablissementProfesseur?.anneeScolaire?.dateDebut || ''
      );
      const year =
        firstDate.getFullYear() + (firstDate.getMonth() >= 8 ? 1 : 0);
      const lastSundayJanuary = this.getLastSundayOfJanuary(year);

      dateDebut = this.etablissementProfesseur?.anneeScolaire?.dateDebut || '';
      dateFin =
        lastSundayJanuary > firstDate
          ? this.formatDate(lastSundayJanuary)
          : this.formatDate(new Date(year + 1, 0, 31));
      // Ne pas affecter de libellé pour une seule période
    } else if (count === 2) {
      libelle = 'Semestre 1'; // Libellé pour la première période
    } else {
      libelle = `Trimestre ${count + 1}`; // Libellé dynamique pour les trimestres
    }

    return { dateDebut, dateFin, libelle };
  }

  getLastSundayOfJanuary(year: number): Date {
    const january31 = new Date(year, 0, 31);
    const dayOfWeek = january31.getDay();
    january31.setDate(january31.getDate() - dayOfWeek);
    return january31;
  }

  adjustPeriodes() {
    const periodesCount = this.periodes.length;

    if (periodesCount === 1) {
      this.setDatesForSinglePeriod();
    } else if (periodesCount === 2) {
      this.setDatesForTwoPeriods();
    } else if (periodesCount > 2) {
      this.setDatesForMultiplePeriods();
    }
  }

  private setDatesForSinglePeriod() {
    const firstPeriode = this.periodes.at(0);
    firstPeriode
      .get('dateDebut')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateDebut);
    firstPeriode
      .get('dateFin')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateFin);
  }

  private setDatesForTwoPeriods() {
    const [firstPeriode, secondPeriode] = [
      this.periodes.at(0),
      this.periodes.at(1),
    ];
    firstPeriode
      .get('dateDebut')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateDebut);

    const firstDate = new Date(
      this.etablissementProfesseur?.anneeScolaire?.dateDebut || ''
    );
    const lastSundayJanuary = this.getLastSundayOfJanuary(
      firstDate.getFullYear() + 1
    );

    firstPeriode.get('dateFin')?.setValue(this.formatDate(lastSundayJanuary));

    const secondStartDate = new Date(lastSundayJanuary);
    secondStartDate.setDate(secondStartDate.getDate() + 7);
    secondPeriode.get('dateDebut')?.setValue(this.formatDate(secondStartDate));
    secondPeriode
      .get('dateFin')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateFin);
  }

  private setDatesForMultiplePeriods() {
    const firstPeriode = this.periodes.at(0);
    const lastPeriode = this.periodes.at(this.periodes.length - 1);

    firstPeriode
      .get('dateDebut')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateDebut);

    for (let i = 1; i < this.periodes.length - 1; i++) {
      this.periodes.at(i).get('dateDebut')?.setValue('');
      this.periodes.at(i).get('dateFin')?.setValue('');
    }

    lastPeriode
      .get('dateFin')
      ?.setValue(this.etablissementProfesseur?.anneeScolaire?.dateFin);
  }

  removePeriode(index: number) {
    this.periodes.removeAt(index); // Supprime la période à l'index spécifié
    this.adjustPeriodes(); // Ajuster les dates des périodes restantes
    this.updateLibelles(); // Recalculer les libellés (Semestre/Trimestre)
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onSubmit() {
    if (this.periodeForm.valid) {
      ;let totalPeriodes = 0
      let totalDevoirs = 0;
      let totalActivites = 0;

      const periodesData: PeriodeDto[] = this.periodes.controls.map(
        (periode) => ({
          libelle: periode.value.libelle!,
          dateDebut: periode.value.dateDebut!,
          dateFin: periode.value.dateFin!,
          etablissementProfesseur: this.etablissementProfesseur!,
        })
      );

      periodesData.forEach((periode, index) => {
        this.periodeService.savePeriode(periode).subscribe({
          next: (createdPeriode) => {
            console.log('Période créée avec succès:', createdPeriode);
            totalPeriodes++; // Incrémenter le compteur de périodes
            // Récupérer les informations de devoirs pour cette période
            const nombreDevoirs =
              this.periodes.at(index).get('nombreDevoir')?.value || 0; // Récupérer le nombre de devoirs
            const coefDevoir =
              this.periodes.at(index).get('coefDevoir')?.value || 0; // Coefficient total
            const isActivityChecked = this.periodes
              .at(index)
              .get('isActivity')?.value; // Si l'activité est cochée
            const coefActivity =
              this.periodes.at(index).get('coefActivity')?.value || 0; // Coefficient d'activité

            const coeffParDevoir =
              nombreDevoirs > 0 ? coefDevoir / nombreDevoirs : 0; // Coefficient par devoir

            // Boucle pour créer chaque devoir
            for (let i = 0; i < nombreDevoirs; i++) {
              const devoirData: DevoirDto = {
                libelle: `Devoir ${i + 1}`,
                type: DevoirDto.TypeEnum.Control,
                coefficient: coeffParDevoir,
                periode: createdPeriode,
              };
              console.log(devoirData);
              this.devoirService.createDevoir(devoirData).subscribe({
                next: (devoirData) => {
                  console.log('Devoir créé avec succès:', devoirData);
                  totalDevoirs++; // Incrémenter le compteur de devoirs (contrôles)
                },
                error: (error) => {
                  console.error('Erreur lors de la création du devoir:', error);
                },
              });
            }

            // Si l'activité est cochée, créer l'activité
            if (isActivityChecked) {
              const activityData: DevoirDto = {
                libelle: 'Activité',
                type: DevoirDto.TypeEnum.Activity,
                coefficient: coefActivity,
                periode: createdPeriode,
              };
              console.log(activityData);

              this.devoirService.createDevoir(activityData).subscribe({
                next: (devoirData) => {
                  console.log('Activité créée avec succès:', devoirData);
                  totalActivites++; // Incrémenter le compteur d'activités
                },
                error: (error) => {
                  console.error(
                    "Erreur lors de la création de l'activité:",
                    error
                  );
                },
              });
            }
          },
          error: (error) => {
            console.error('Erreur lors de la création de la période:', error);
          },
        });
      });
      // Afficher les résultats dans une modal après la création de toutes les périodes, contrôles et activités
      setTimeout(() => {
        const message = `Périodes créées: ${totalPeriodes}\nContrôles créés: ${totalDevoirs}\nActivités créées: ${totalActivites}`;
        this.showSuccessModal(message);
        this.loadPeriodes();
        this.resetForm();
      }, 1000); // Un petit délai pour être sûr que toutes les souscriptions soient terminées
    }
  }

  toggleCoefActivity(index: number): void {
    const periode = this.periodes.at(index);
    const coefDevoirControl = periode.get('coefDevoir');
    const coefActivityControl = periode.get('coefActivity');
    const isActivityChecked = periode.get('isActivity')?.value;

    if (isActivityChecked) {
      const coefDevoir = coefDevoirControl?.value || 0;
      coefActivityControl?.setValue(100 - coefDevoir);
    } else {
      coefActivityControl?.setValue(0);
    }

    // Synchroniser les valeurs 'isActivity' et 'coefActivity' dans toutes les périodes
    this.syncFieldAcrossPeriods('coefActivity');
  }

  deletePeriode(): void {
    if (this.periodeToDelete) {
      this.periodeService
        .deletePeriode(this.periodeToDelete.idPeriode!)
        .subscribe(() => {
          this.loadPeriodes();
          this.modalService.dismissAll();
        });
    }
  }
  confirmDeletePeriode(periode: PeriodeDto): void {
    this.periodeToDelete = periode;
    this.modalService.open(this.confirmDeleteModal, {
      ariaLabelledBy: 'confirmDeleteModalLabel',
    }); // Utilise le template
  }

  resetForm(): void {
    this.periodes.clear(); // Vider toutes les périodes du FormArray
    this.periodeForm.reset();
    this.selectedPeriode = null;
  }

  showSuccessModal(message: string): void {
    this.successMessage = message; // Assigne le message à la propriété
    const modalRef = this.modalService.open(this.successModal); // Utilise le template
  }
  syncFieldAcrossPeriods(fieldName: string, isCheckbox: boolean = false): void {
    // Itérer sur chaque période pour ajouter un écouteur
    this.periodes.controls.forEach((periode, index) => {
      periode.get(fieldName)?.valueChanges.subscribe((newValue) => {
        // Lorsqu'une valeur change, mettre à jour ce champ dans toutes les périodes
        this.periodes.controls.forEach((otherPeriode, otherIndex) => {
          if (otherIndex !== index) {
            // On évite de réécrire sur l'élément actuel
            if (isCheckbox) {
              otherPeriode
                .get(fieldName)
                ?.setValue(newValue, { emitEvent: false }); // Ne pas émettre d'événement pour éviter les boucles infinies
              if (fieldName === 'isActivity') {
                this.toggleCoefActivity(otherIndex); // Mettre à jour coefActivity si 'isActivity' change
              }
            } else {
              otherPeriode
                .get(fieldName)
                ?.setValue(newValue, { emitEvent: false });
            }
          }
        });
      });
    });
  }

  editPeriode(periode: any): void {
    this.selectedPeriode = periode;
    this.editForm.patchValue(periode);
    this.isEditing = true; // Active le mode édition
  }

  onUpdate(): void {
    if (this.editForm.valid && this.selectedPeriode) {
      const periodeData: PeriodeDto = {
        idPeriode: this.selectedPeriode?.idPeriode, // Keep the existing ID, if applicable
        libelle: this.editForm.get('libelle')?.value, // Get 'libelle' value
        dateDebut: this.editForm.get('dateDebut')?.value, // Get 'dateDebut' value
        dateFin: this.editForm.get('dateFin')?.value, // Get 'dateFin' value
        etablissementProfesseur: this.selectedPeriode?.etablissementProfesseur // Assuming it's not modified here
      };
      console.log(periodeData)
      this.periodeService.savePeriode(periodeData).subscribe(response => {
        // Gestion de la réponse, réinitialiser le formulaire, etc.
        this.isEditing = false;
        this.selectedPeriode = null;
        this.periodeForm.reset();
        this.showSuccessModal("mise a jour a bien effectuee");
        this.loadPeriodes();
      });
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedPeriode = null;
    this.editForm.reset(); // Réinitialise le formulaire d'édition
  }

  
  toggleDevoir(): void {
    this.showDevoir = !this.showDevoir; // Toggle the flag
  }
}
