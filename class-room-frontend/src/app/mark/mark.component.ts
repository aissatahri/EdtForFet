import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UserProfileService } from '../services/user-profile-service.service';
import {
  AnneeScolaireDto,
  ClasseDto,
  ClasseEleveDto,
  EleveDevoirDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  NiveauService,
  ProfesseurDto,
  SousClasseDto,
} from '../api';
import { ClasseService } from '../services/classe.service';
import { SousclasseService } from '../services/sousclasse.service';
import { ClasseeleveService } from '../services/classeeleve.service';
import {
  DevoirDto,
  NiveauDto,
  PeriodeDto,
} from '../../../path/to/generated-client';
import { BehaviorSubject, forkJoin, map, Observable } from 'rxjs';
import { PeriodeService } from '../services/periode.service';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DevoirService } from '../services/devoir.service';
import { Router, RouterModule } from '@angular/router';
import { DevoirEleveService } from '../services/devoir-eleve.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { amiriFont } from '../../assets/fonts/amiriFont';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ExcelService } from '../services/excel-service.service';
import { saveAs } from 'file-saver';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-mark',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './mark.component.html',
  styleUrl: './mark.component.css',
})
export class MarkComponent implements OnInit {
  formGroup!: FormGroup;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  periodes: PeriodeDto[] = []; // Liste des années scolaires
  devoirs: DevoirDto[] = []; // Liste des années scolaires
  classes: ClasseDto[] = []; // Assurez-vous que cette propriété est définie
  sousClasses: SousClasseDto[] = []; // Ajout de la propriété sousClasses
  openPanelId1: string | null = 'panelContent6'; // For the first card
  openPanelId2: string | null = 'panelContent7'; // For the second card
  classes$: Observable<ClasseDto[]> | undefined;
  selectedClasseId: number | null = null;
  selectedSousClasseId: number | null = null;
  isEditing: boolean = false;
  currentClasse: ClasseDto | null = null;
  // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalClasse') confirmDeleteModal!: TemplateRef<any>;
  successMessage: string = '';
  classeEleves: ClasseEleveDto[] = [];
  hasSousClasses: boolean = false;
  absences: { [key: number]: boolean } = {}; // Gestion des absences
  @ViewChild('absenceModal') absenceModal!: ElementRef;
  selectedDate: string = ''; // Pour stocker la date sélectionnée
  selectedTime: string = ''; // Pour stocker l'heure sélectionnée
  // Propriétés pour stocker la date et l'heure globales
  globalDate: string = ''; // Pour stocker la date globale
  globalTime: string = ''; // Pour stocker l'heure globale
  eleveDevoirs: EleveDevoirDto[] = []; // Store the list of devoirs élèves
  selectedDevoirId: number | null = null;
  periodeId: number | null = null;
  // Reference to the modal element
  @ViewChild('successModal') successModal!: ElementRef;
  isSuccessModalVisible: boolean = false;
  uploadedFile: File | null = null;
  workbook: XLSX.WorkBook | null = null;
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private periodeService: PeriodeService,
    private devoirService: DevoirService,
    private elevedevoirService: DevoirEleveService,
    private router: Router,
    private excelService: ExcelService,
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

    this.formGroup = new FormGroup({
      periode: new FormControl(null, Validators.required),
      niveau: new FormControl(null, Validators.required),
      classe: new FormControl(null, Validators.required),
      sousClasse: new FormControl(null),
      marks: new FormArray(
        this.eleveDevoirs.map(
          (eleveDevoir) =>
            new FormControl(eleveDevoir.note, [
              Validators.min(0),
              Validators.max(20),
              Validators.pattern(/^\d+(\.\d{1,2})?$/), // Expression régulière pour deux décimales
            ])
        )
      ),
    });

    this.loadUserProfile();

    this.router.events.subscribe((event) => {
      console.log(event); // Log the events to the console
    });
  }
  isControlInvalid(i: number): boolean {
    const control = (this.formGroup.get('marks') as FormArray).at(i);
    return control.invalid && (control.touched || control.dirty);
  }
  get marks(): FormArray {
    return this.formGroup.get('marks') as FormArray;
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
            console.log(
              this.etablissementProfesseur?.idEtablissementProfesseur
            );

            console.log(
              this.etablissementProfesseur.anneeScolaire?.idAnneeScolaire
            );
            console.log(
              this.etablissementProfesseur.etablissement?.idEtablissement
            );
            console.log(this.etablissementProfesseur.professeur?.idProfesseur);
            this.loadNiveaux();
            this.loadPeriodes(
              this.etablissementProfesseur.idEtablissementProfesseur!
            );
          },
          error: console.error,
        });
    }
  }

  loadNiveaux(): void {
    if (this.etablissementProfesseur?.idEtablissementProfesseur) {
      this.niveauService
        .findByEtablissementProfesseurId1(
          this.etablissementProfesseur.idEtablissementProfesseur
        )
        .subscribe({
          next: (niveaux) => {
            this.niveaux$.next(niveaux);
            // Vérifiez si la première niveau a un ID valide avant de charger les devoirs
            const firstNiveau = niveaux[0];
            if (firstNiveau && firstNiveau.idNiveau !== undefined) {
              //this.loadClassesByNiveau(firstNiveau.idNiveau);
            }
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des Niveau', err);
          },
        });
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }

  loadPeriodes(etablissementProfesseurId: number): void {
    console.log(
      'etablissementProfesseurId --------->' + etablissementProfesseurId
    );
    this.periodeService
      .getPeriodesByEtablissementProfesseurId(etablissementProfesseurId)
      .subscribe(
        (periodes: PeriodeDto[]) => {
          this.periodes = periodes; // Mettre à jour la liste des périodes
          const currentPeriode = this.getCurrentPeriode();
          // if (currentPeriode) {
          //   this.formGroup.get('periode')?.setValue(currentPeriode.idPeriode);
          // }
        },
        (error) => {
          console.error('Erreur lors du chargement des périodes', error);
        }
      );
  }

  getCurrentPeriode(): PeriodeDto | null {
    const currentDate = new Date(); // Date courante

    for (const periode of this.periodes) {
      const dateDebut = new Date(periode.dateDebut as string);
      const dateFin = new Date(periode.dateFin as string);

      // Comparer si la date actuelle est entre dateDebut et dateFin
      if (currentDate >= dateDebut && currentDate <= dateFin) {
        return periode; // Retourne la période correspondante
      }
    }
    return null; // Si aucune période ne correspond
  }

  loadDevoirsEleves(): void {
    const marksArray = this.marks;
    marksArray.clear(); // Réinitialise le FormArray
    console.log('devoir selectionne ', this.selectedDevoirId);
    if (this.selectedClasseId !== null && this.selectedDevoirId !== null) {
      // Étape 1: Récupérer les élèves de la classe sélectionnée
      this.classeEleveService.findByClasseId(this.selectedClasseId).subscribe(
        (classeEleves) => {
          const elevesInClasse = classeEleves.map(
            (classeEleve) => classeEleve.eleve?.idEleve
          );
          // Étape 2: Récupérer tous les élèves associés au devoir sélectionné
          this.elevedevoirService
            .findAllByDevoir(this.selectedDevoirId!)
            .subscribe(
              (eleveDevoirs) => {
                console.log(
                  'methode loadDevoirEleve ------> taille elevedevoir ',
                  this.eleveDevoirs.length
                );
                // Filtrer les élèves pour ne garder que ceux qui sont à la fois dans la classe et associés au devoir
                const filteredEleveDevoirs = eleveDevoirs.filter(
                  (eleveDevoir) =>
                    elevesInClasse.includes(eleveDevoir.eleve?.idEleve)
                );

                // Trier les élèves filtrés par leur numéro (num)
                this.eleveDevoirs = filteredEleveDevoirs.sort(
                  (a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)
                );

                // Mettre à jour le formulaire avec les données des élèves filtrés
                this.populateMarkArray();
              },
              (error) => {
                console.error(
                  'Erreur lors de la récupération des devoirs élèves',
                  error
                );
              }
            );
        },
        (error) => {
          console.error(
            'Erreur lors de la récupération des élèves de la classe',
            error
          );
        }
      );
    }
  }

  populateMarkArray(): void {
    const marksArray = this.marks;
    marksArray.clear();
    console.log(
      'methode populateMarkArray ------> taille elevedevoir ',
      this.eleveDevoirs.length
    );
    this.eleveDevoirs.forEach((eleveDevoir) => {
      const existingNote = eleveDevoir.note ?? '';
      console.log(
        `Ajout de la note pour l'élève ${eleveDevoir.eleve?.nom}:`,
        existingNote
      );
      marksArray.push(new FormControl(existingNote));
    });
  }

  onPeriodeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.periodeId = target.value ? parseInt(target.value) : null;

    if (this.periodeId) {
      this.loadDevoirsByPeriode(this.periodeId); // Load devoirs for selected period
    } else {
      this.devoirs = []; // Reset devoirs if no period is selected
    }
  }

  onDevoirChange(event: any): void {
    this.selectedDevoirId = event.target.value;
    this.eleveDevoirs = []; // Vider la liste avant de charger les nouvelles données
    this.selectedDevoirId = parseInt((event.target as HTMLSelectElement).value);
    this.loadDevoirsEleves(); // Load the assignments for the selected devoir
  }

  removeEleveDevoir(devoir: EleveDevoirDto) {}

  loadDevoirsByPeriode(periodeId: number): void {
    this.devoirService.getDevoirsByPeriodeId(periodeId).subscribe({
      next: (devoirs) => {
        this.devoirs = devoirs;
      },
      error: (err) =>
        console.error('Erreur lors du chargement des devoirs', err),
    });
  }

  onNiveauChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const niveauId = target.value ? parseInt(target.value) : null;

    if (niveauId) {
      this.loadClassesByNiveau(niveauId); // Charge les classes pour le niveau sélectionné
    } else {
      this.classes = [];
      this.sousClasses = [];
    }
  }

  loadClassesByNiveau(niveauId: number): void {
    this.classeService.getClassesByNiveau(niveauId).subscribe({
      next: (classes) => (this.classes = classes),
      error: (err) =>
        console.error('Erreur lors du chargement des classes', err),
    });
  }

  onClasseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const classeId = target.value;
    this.selectedClasseId = Number(classeId);
    // Réinitialiser les sous-classes et l'ID de sous-classe sélectionnée
    this.sousClasses = [];
    this.selectedSousClasseId = null;
    console.log(this.selectedClasseId);
    // Charger les élèves associés à la nouvelle classe sélectionnée
    //this.loadClasseEleves();
    // Charger les sous-classes associées à la nouvelle classe
    this.loadSousClassesByClasseId(this.selectedClasseId);
    //this.loadDevoirsEleves();
  }

  loadClasseEleves(): void {
    const marksArray = this.marks;
    marksArray.clear(); // Reset the FormArray
    if (this.selectedClasseId !== null) {
      // Fetching the students based on selected class and subclass if available
      this.classeEleveService.findByClasseId(this.selectedClasseId).subscribe(
        (data) => {
          this.classeEleves = data.sort(
            (a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)
          );
          this.populateMarkArray();
        },
        (error) => {
          console.error('Erreur lors de la récupération des élèves', error);
        }
      );
    }
  }

  togglePanel(panelId: string): void {
    if (panelId === 'panelContent6') {
      this.openPanelId1 = this.openPanelId1 ? null : panelId; // Toggle for panel 1
    } else if (panelId === 'panelContent7') {
      this.openPanelId2 = this.openPanelId2 ? null : panelId; // Toggle for panel 2
    }
  }

  isPanelOpen(panelId: string): boolean {
    return (
      (panelId === 'panelContent6' && this.openPanelId1 !== null) ||
      (panelId === 'panelContent7' && this.openPanelId2 !== null)
    );
  }

  loadSousClassesByClasseId(classeId: number): void {
    console.log(`Chargement des sous-classes pour la classe ID: ${classeId}`);
    this.sousclasseService.getSousClassesByClasseId(classeId).subscribe(
      (data) => {
        this.sousClasses = data;
        this.hasSousClasses = this.sousClasses.length > 0; // Met à jour la propriété hasSousClasses

        // Si aucune sous-classe, on peut charger les élèves directement
        if (!this.hasSousClasses) {
          this.selectedSousClasseId = null; // Réinitialise la sous-classe sélectionnée si aucune sous-classe n'est trouvée
          this.loadClasseEleves();
        }

        console.log('Sous-classes chargées:', this.sousClasses);
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-classes', error);
      }
    );
  }
  onSousClasseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const sousClasseId = target.value;
    if (sousClasseId === '') {
      // Si l'utilisateur sélectionne l'option "Choisir une sous-classe", on appelle la méthode pour charger les sous-classes
      this.selectedSousClasseId = null;
      if (this.selectedClasseId !== null) {
        this.loadClasseEleves();
      }
    } else {
      this.selectedSousClasseId = Number(sousClasseId);
      console.log(this.selectedSousClasseId);
      this.loadClasseEleves();
    }
  }

  page: number = 1; // Page actuelle
  itemsPerPage: number = 15; // Nombre d'éléments par page

  // Méthode pour récupérer le tableau paginé
  getPaginatedClasseEleves(): EleveDevoirDto[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.eleveDevoirs.slice(startIndex, endIndex);
  }

  // Méthode pour passer à la page précédente
  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  // Méthode pour passer à la page suivante
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  // Getter pour calculer le nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.eleveDevoirs.length / this.itemsPerPage);
  }

  enregistrerNotes(): void {
    const notesToSave: EleveDevoirDto[] = [];

    this.eleveDevoirs.forEach((eleveDevoir, index) => {
      const noteValue = this.marks.at(index)?.value; // Obtenir la note correspondante
      const eleveDevoirDto: EleveDevoirDto = {
        idEleveDevoir: eleveDevoir.idEleveDevoir, // ID existant
        eleve: eleveDevoir.eleve, // Élève associé
        devoir: eleveDevoir.devoir, // Devoir associé
        datePassage: eleveDevoir.datePassage, // Utiliser la date globale si nécessaire
        heurePassage: eleveDevoir.heurePassage, // Utiliser l'heure globale si nécessaire
        note: eleveDevoir.note, // Obtenir la valeur de la note
      };
      notesToSave.push(eleveDevoirDto);
    });

    const saveObservables: Observable<EleveDevoirDto>[] = notesToSave.map(
      (note) => this.elevedevoirService.create(note) // Appeler la méthode create pour chaque EleveDevoirDto
    );

    forkJoin(saveObservables).subscribe({
      next: (responses) => {
        const successfulSavesCount = responses.length;
        console.log('Notes enregistrées avec succès:', responses);

        // Utilisation de TranslateService pour obtenir le message traduit
        this.translate
          .get('MODAL.NOTES_SAVED', { count: successfulSavesCount })
          .subscribe((res: string) => {
            this.successMessage = res; // Attribuer le message traduit
          });
        this.successModal.nativeElement.style.display = 'block';
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement des notes:", err);
        this.successMessage =
          "Erreur lors de l'enregistrement des notes. Veuillez réessayer.";
        this.successModal.nativeElement.style.display = 'block';
      },
    });
  }

  // enregistrerNotes(): void {
  //   const notesToSave: EleveDevoirDto[] = [];

  //   this.eleveDevoirs.forEach((eleveDevoir, index) => {
  //     const noteValue = this.marks.at(index)?.value; // Obtenir la note correspondante

  //     // Si le champ est vide ou null, on affecte null, sinon on convertit en nombre
  //     let noteToSave: number | null = null;

  //     if (noteValue !== '' && noteValue !== null && noteValue !== undefined) {
  //       noteToSave = Number(noteValue);
  //     }

  //     // Créer un objet EleveDevoirDto
  //     const eleveDevoirDto: EleveDevoirDto = {
  //       idEleveDevoir: eleveDevoir.idEleveDevoir, // ID existant
  //       eleve: eleveDevoir.eleve, // Élève associé
  //       devoir: eleveDevoir.devoir, // Devoir associé
  //       datePassage: eleveDevoir.datePassage, // Utiliser la date globale si nécessaire
  //       heurePassage: eleveDevoir.heurePassage, // Utiliser l'heure globale si nécessaire
  //       note: noteToSave, // Mettre null si la note est vide
  //     };

  //     notesToSave.push(eleveDevoirDto);
  //   });

  //   // Si des notes sont prêtes à être enregistrées
  //   if (notesToSave.length > 0) {
  //     const saveObservables: Observable<EleveDevoirDto>[] = notesToSave.map(
  //       (note) => this.elevedevoirService.create(note) // Appeler la méthode create pour chaque EleveDevoirDto
  //     );

  //     // Utiliser forkJoin pour effectuer toutes les requêtes de sauvegarde en parallèle
  //     forkJoin(saveObservables).subscribe({
  //       next: (responses) => {
  //         const successfulSavesCount = responses.length;
  //         console.log('Notes enregistrées avec succès:', responses);
  //         this.successMessage = `Les notes ont été enregistrées avec succès ! Nombre de lignes enregistrées: ${successfulSavesCount}`;
  //         this.successModal.nativeElement.style.display = 'block';
  //       },
  //       error: (err) => {
  //         console.error("Erreur lors de l'enregistrement des notes:", err);
  //         this.successMessage = "Erreur lors de l'enregistrement des notes. Veuillez réessayer.";
  //         this.successModal.nativeElement.style.display = 'block';
  //       },
  //     });
  //   } else {
  //     this.successMessage = "Aucune note valide à enregistrer.";
  //     this.successModal.nativeElement.style.display = 'block';
  //   }
  // }

  closeSuccessModal(): void {
    this.successModal.nativeElement.style.display = 'none'; // Ferme le modal
  }

  trackByFn(index: number, item: EleveDevoirDto): number {
    return item.idEleveDevoir!; // Assurez-vous que chaque élément a un identifiant unique
  }

  // onNoteChange(event: Event, eleveDevoir: EleveDevoirDto): void {
  //   const input = event.target as HTMLInputElement;
  //   eleveDevoir.note = Number(input.value); // Assurez-vous de convertir en nombre
  // }
  // onNoteChange(event: Event, eleveDevoir: EleveDevoirDto): void {
  //   const newValue = (event.target as HTMLInputElement).value; // Obtenir la valeur de l'input

  //   // Si la valeur est vide, assignez null à la note
  //   if (newValue === '') {
  //     eleveDevoir.note = null; // Assignez null si l'entrée est vide
  //   } else {
  //     eleveDevoir.note = Number(newValue); // Convertir en nombre si ce n'est pas vide
  //   }
  // }
  // onNoteChange(event: Event, eleveDevoir: EleveDevoirDto): void {
  //   const newValue = (event.target as HTMLInputElement).value; // Obtenir la valeur de l'input

  //   // Vérifier si la nouvelle valeur est vide
  //   if (newValue === '') {
  //     eleveDevoir.note = null; // Assigner null si l'entrée est vide
  //   } else {
  //     // Convertir en nombre
  //     const numericValue = parseFloat(newValue);

  //     // Valider que la valeur est entre 0 et 20, et a deux décimales
  //     if (numericValue >= 0 && numericValue <= 20 && (numericValue * 100) % 1 === 0) {
  //       eleveDevoir.note = numericValue; // Assigner la valeur si elle est valide
  //     } else {
  //       // Optionnel : vous pouvez gérer un message d'erreur ici ou une autre action
  //       console.error('La note doit être un nombre entre 0 et 20 avec deux décimales.');
  //     }
  //   }
  // }
  // onNoteChange(event: Event, eleveDevoir: EleveDevoirDto): void {
  //   const newValue = (event.target as HTMLInputElement).value; // Obtenir la valeur de l'input

  //   // Vérifier si la nouvelle valeur est vide
  //   if (newValue === '') {
  //     eleveDevoir.note = null; // Assigner null si l'entrée est vide
  //     return; // Sortir de la fonction
  //   }

  //   // Convertir en nombre
  //   const numericValue = parseFloat(newValue);

  //   // Vérifier si la conversion a réussi
  //   if (isNaN(numericValue)) {
  //     console.error('Veuillez entrer un nombre valide.');
  //     return; // Sortir si la conversion a échoué
  //   }

  //   // Valider que la valeur est entre 0 et 20 et a deux décimales
  //   if (numericValue >= 0 && numericValue <= 20 && /^\d+(\.\d{1,2})?$/.test(newValue)) {
  //     eleveDevoir.note = numericValue; // Assigner la valeur si elle est valide
  //   } else {
  //     // Afficher un message d'erreur
  //     console.error('La note doit être un nombre entre 0 et 20 avec jusqu\'à deux décimales.');
  //     eleveDevoir.note = null; // Optionnel : réinitialiser la note à null en cas d'erreur
  //   }
  // }
  onNoteChange(event: Event, eleveDevoir: EleveDevoirDto): void {
    const newValue = (event.target as HTMLInputElement).value; // Obtenir la valeur de l'input

    // Vérifier si la nouvelle valeur est vide
    if (newValue === '') {
      eleveDevoir.note = null; // Assigner null si l'entrée est vide
      return; // Sortir de la fonction
    }

    // Convertir en nombre
    const numericValue = parseFloat(newValue);

    // Vérifier si la conversion a réussi et que la valeur est entre 0 et 20
    if (
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 20 &&
      /^\d+(\.\d{1,2})?$/.test(newValue)
    ) {
      eleveDevoir.note = numericValue; // Assigner la valeur si elle est valide
    } else {
      // Afficher un message d'erreur
      console.error(
        "La note doit être un nombre entre 0 et 20 avec jusqu'à deux décimales."
      );
      eleveDevoir.note = null; // Réinitialiser la note à null en cas d'erreur
    }
  }

  private devoirSelcted?: DevoirDto;
  // Méthode pour récupérer le devoir par ID
  getDevoirById(id: number): Observable<DevoirDto> {
    return this.devoirService.getDevoirById(id).pipe(
      // Si vous avez besoin de transformer l'objet, vous pouvez le faire ici
      map((devoir: DevoirDto) => (this.devoirSelcted = devoir)) // Simplement retourner l'objet DevoirDto
    );
  }
  onNotesClick() {}

  imprimer() {
    // Initialiser le PDF
    const doc: any = new jsPDF({
      orientation: 'portrait',
    });

    // Ajouter la police Amiri
    doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');

    // Ajouter une image en haut de la page
    const img = new Image();
    img.src = 'assets/images/logo_1.png';
    img.onload = () => {
      const maxWidth = doc.internal.pageSize.getWidth() - 20;
      const maxHeight = 15;

      // Calculer le rapport d'aspect de l'image
      const aspectRatio = img.width / img.height;

      let imgWidth, imgHeight;
      if (img.width > maxWidth) {
        imgWidth = maxWidth;
        imgHeight = maxWidth / aspectRatio;
      } else {
        imgWidth = img.width;
        imgHeight = img.height;
      }

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }

      const imgY = 5; // Position Y pour l'image
      const imgX = (doc.internal.pageSize.getWidth() - imgWidth) / 2;

      // Ajouter l'image au PDF
      doc.addImage(img, 'PNG', imgX, imgY, imgWidth, imgHeight);

      // Ajouter le tableau des informations juste en dessous de l'image
      const textSpacing = 0; // Réduit l'espace entre l'image et le texte
      const textY = imgY + imgHeight;

      // Texte en arabe
      const etab = `${
        this.etablissement?.libelle || 'Établissement Non Défini'
      }`;
      const prof = `${this.professeur?.nom || 'Nom Non Défini'} ${
        this.professeur?.prenom || 'Prénom Non Défini'
      }`;
      const matiere = 'المعلوميات';

      // Ajouter le tableau avec les informations (Matière, Professeur, Établissement)
      (doc as any).autoTable({
        startY: textY,
        head: [],
        body: [
          [
            {
              content: `المادة : ${matiere}`,
              styles: {
                halign: 'center',
                cellWidth: 60,
                overflow: 'linebreak',
              },
            },
            {
              content: `الاستاذ: ${prof}`,
              styles: {
                halign: 'center',
                cellWidth: 60,
                overflow: 'linebreak',
              },
            },
            {
              content: `المؤسسة: ${etab}`,
              styles: {
                halign: 'center',
                cellWidth: 80,
                overflow: 'linebreak',
              },
            },
          ],
        ],
        styles: {
          font: 'Amiri',
          fontSize: 12,
          cellPadding: 5,
          valign: 'middle',
          lineColor: [255, 255, 255],
          lineWidth: 0,
        },
        theme: 'plain',
      });

      // Si un devoir est sélectionné
      if (this.selectedDevoirId) {
        this.getDevoirById(this.selectedDevoirId).subscribe(
          () => {
            // Ajouter un tableau avec l'année scolaire, la période et le devoir
            const anneeScolaire = `${this.devoirSelcted?.periode?.etablissementProfesseur?.anneeScolaire?.libelle}`;
            const periode = `${this.devoirSelcted?.periode?.libelle}`;
            const devoir = `${this.devoirSelcted?.libelle || 'الفرض'}`;

            // Ajouter ce tableau sans bordure avec un espace réduit
            (doc as any).autoTable({
              startY: textY + 5, // doc.autoTable.previous.finalY, // Réduire cet espace de 10 à 5
              head: [],
              body: [
                [
                  {
                    content: `السنة الدراسية : ${anneeScolaire}`,
                    styles: {
                      halign: 'center',
                      cellWidth: 70,
                      fontStyle: 'normal',
                      overflow: 'linebreak',
                    },
                  },
                  {
                    content: `الدورة : ${periode}`,
                    styles: {
                      halign: 'center',
                      cellWidth: 50,
                      fontStyle: 'normal',
                      overflow: 'linebreak',
                    },
                  },
                  {
                    content: `الفرض : ${devoir}`,
                    styles: {
                      halign: 'center',
                      cellWidth: 70,
                      fontStyle: 'normal',
                      overflow: 'linebreak',
                    },
                  },
                ],
              ],
              styles: {
                font: 'Amiri',
                fontSize: 12,
                cellPadding: 5,
                valign: 'middle',
                lineColor: [255, 255, 255], // Pas de bordure
                lineWidth: 0,
              },
              margin: { left: 10 }, // Ajuster la marge pour un bon alignement
              theme: 'plain',
            });
            const classeNom = this.classeEleves[0].classe?.libelle
            const titleText = `${this.classeEleves[0].classe?.libelle} نقط المراقبة المستمرة `;
            const titleWidth = doc.getTextWidth(titleText);
            const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
            const titleY = doc.autoTable.previous.finalY + 3;

            // Ajouter le titre au PDF
            doc.text(titleText, titleX, titleY);

            // Position Y pour le tableau des élèves
            let tableY = doc.autoTable.previous.finalY + 5;

            // Assurez-vous que les données sont correctement formatées
            const tableRows = this.eleveDevoirs.map(
              (eleveDevoir: EleveDevoirDto) => {
                return {
                  num: eleveDevoir.eleve?.num || 'Num Non Défini',
                  code: eleveDevoir.eleve?.code || 'Code Non Défini',
                  nom: eleveDevoir.eleve?.nom || 'Nom Non Défini',
                  note:
                    eleveDevoir.note !== undefined ? eleveDevoir.note : 'N/A',
                };
              }
            );

            if (tableRows.length === 0) {
              console.warn(
                "Aucune donnée d'élève trouvée, utilisant des données de test."
              );
              tableRows.push(
                { num: 1, code: 'A001', nom: 'John Doe', note: 15 },
                { num: 2, code: 'A002', nom: 'Jane Doe', note: 17 }
              );
            }

            const tableColumns = [['Numéro', 'Code', 'Nom', 'Note']];

            (doc as any).autoTable({
              startY: tableY,
              head: tableColumns,
              body: tableRows.map((row) => [
                row.num,
                row.code,
                row.nom,
                row.note,
              ]),
              styles: {
                font: 'Amiri',
                fontSize: 11,
                cellPadding: 1,
                valign: 'middle',
                halign: 'center',
                lineColor: [44, 62, 80],
                lineWidth: 1,
                minCellHeight: 6,
              },
              headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
              },
              theme: 'grid',
            });

            const notes = tableRows
              .map((row) => row.note)
              .filter((note) => note !== 'N/A') as number[];
            const meilleureNote = Math.max(...notes);
            const pireNote = Math.min(...notes);
            const moyenneNote = notes.reduce((a, b) => a + b, 0) / notes.length;

            const statsColumns = [
              ['Meilleure Note', 'Pire Note', 'Moyenne de la Classe'],
            ];
            const statsRows = [
              [meilleureNote, pireNote, moyenneNote.toFixed(2)],
            ];

            let statsTableY = (doc as any).autoTable.previous.finalY + 3;
            (doc as any).autoTable({
              startY: statsTableY,
              head: statsColumns,
              body: statsRows,
              styles: {
                font: 'Amiri',
                fontSize: 11,
                cellPadding: 1,
                valign: 'middle',
                halign: 'center',
                lineColor: [255, 255, 255],
                lineWidth: 0,
              },
              headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
              },
              theme: 'plain',
            });
            // Remplacer les espaces et caractères non autorisés dans le nom de fichier
            const sanitizeFileName = (str: string) =>
              str
                .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '')
                .replace(/\s+/g, '_');

            // Construire le nom de fichier
            const nomFichier = `${sanitizeFileName(
              devoir
            )}_${sanitizeFileName(periode)}_${sanitizeFileName(
              classeNom!
            )}.pdf`;

            // Enregistrer le PDF après avoir ajouté tous les éléments
            doc.save(nomFichier+'.pdf');
          },
          (error) => {
            console.error('Erreur lors de la récupération du devoir:', error);
          }
        );
      } else {
        doc.save('nomFichier.pdf');
      }
    };
  }
  // Méthode pour déclencher la sélection de fichier et soumettre
  // Méthode pour déclencher la sélection du fichier
  triggerFileSelectionAndSubmit(fileInput: HTMLInputElement): void {
    fileInput.click(); // Ouvrir la boîte de dialogue pour sélectionner un fichier
  }

  // Méthode appelée lors de la sélection du fichier pour le soumettre
  onFileChangeAndSubmit(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.uploadedFile = target.files[0]; // Stocker le fichier sélectionné

      //Vérifiez si tous les critères (IDs) sont sélectionnés
      if (!this.selectedClasseId || !this.periodeId || !this.selectedDevoirId) {
        alert('Veuillez sélectionner une classe, une période et un devoir.');
        return;
      }

      console.log('classe ' + this.selectedClasseId);
      console.log('periode ' + this.periodeId);
      console.log('devoir ' + this.selectedDevoirId);

      // Envoyer le fichier avec les paramètres (IDs) au backend
      this.excelService
        .uploadExcel(
          this.uploadedFile,
          this.selectedClasseId!,
          this.periodeId!,
          this.selectedDevoirId!
        )
        .subscribe(
          (response) => {
            const blob = new Blob([response], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, this.uploadedFile!.name); // Télécharger le fichier modifié
            console.log('Fichier Excel modifié téléchargé avec succès.');
          },
          (error) => {
            console.error(
              'Erreur lors de la modification du fichier Excel.',
              error
            );
          }
        );
    }
  }
}
