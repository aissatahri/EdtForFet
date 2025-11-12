import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UserProfileService } from '../../services/user-profile-service.service';
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
} from '../../api';
import { ClasseService } from '../../services/classe.service';
import { SousclasseService } from '../../services/sousclasse.service';
import { ClasseeleveService } from '../../services/classeeleve.service';
import {
  DevoirDto,
  NiveauDto,
  PeriodeDto,
} from '../../../../path/to/generated-client';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { PeriodeService } from '../../services/periode.service';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DevoirService } from '../../services/devoir.service';
import { Router, RouterModule } from '@angular/router';
import { DevoirEleveService } from '../../services/devoir-eleve.service';
import { LocalTime } from '@js-joda/core'; // Exemple d'import, dépend de votre environnement
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-mark-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './mark-student.component.html',
  styleUrl: './mark-student.component.css',
})
export class MarkStudentComponent {
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
  @ViewChild('absenceModal') absenceModal!: ElementRef;
  selectedDate: string = ''; // Pour stocker la date sélectionnée
  selectedTime: string = ''; // Pour stocker l'heure sélectionnée
  // Propriétés pour stocker la date et l'heure globales
  globalDate: string = ''; // Pour stocker la date globale
  globalTime: string = ''; // Pour stocker l'heure globale
  eleveDevoirs: EleveDevoirDto[] = []; // Store the list of devoirs élèves
  selectedDevoirId: number | null = null;
  // Reference to the modal element
  @ViewChild('successModal') successModal!: ElementRef;
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
      marks: new FormArray([]), // FormArray to handle notes 
    });
    this.loadUserProfile();

    this.router.events.subscribe((event) => {
      console.log(event); // Log the events to the console
    });
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

  // loadDevoirsEleves(): void {
  //   const marksArray = this.marks;
  //   marksArray.clear(); // Reset the FormArray
  //   if (this.selectedClasseId !== null && this.selectedDevoirId !== null) {
  //     this.elevedevoirService.findAllByDevoir(this.selectedDevoirId).subscribe(
  //       (data) => {
  //         if(data)
  //         this.eleveDevoirs = data.sort(
  //           (a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)
  //         );
  //         this.populateMarkArray(); // Update the form with new data
  //       },
  //       (error) => {
  //         console.error('Erreur lors de la récupération des devoirs élèves', error);
  //       }
  //     );
  //   }
  // }

  populateMarkArray(): void {
    const marksArray = this.marks;
    marksArray.clear();
    console.log(
      'methode populateMarkArray ------> taille elevedevoir ',
      this.eleveDevoirs.length
    );
    this.eleveDevoirs.forEach(() => {
      marksArray.push(new FormControl('')); // Create a text input for each student assignment
    });
  }

  onPeriodeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const periodeId = target.value ? parseInt(target.value) : null;

    if (periodeId) {
      this.loadDevoirsByPeriode(periodeId); // Load devoirs for selected period
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

  removeEleveDevoir(eleveDevoir: EleveDevoirDto): void {
    if (!eleveDevoir.idEleveDevoir) {
      console.error('Impossible de supprimer : ID du devoir élève manquant');
      return;
    }
  
    // Appel au service pour supprimer l'élève devoir
    this.elevedevoirService.delete(eleveDevoir.idEleveDevoir).subscribe({
      next: () => {
        console.log('Devoir élève supprimé avec succès');
        // Met à jour la liste localement après suppression réussie
        this.eleveDevoirs = this.eleveDevoirs.filter(
          (item) => item.idEleveDevoir !== eleveDevoir.idEleveDevoir
        );
        this.successMessage = 'Le devoir élève a été supprimé avec succès.';
        this.successModal.nativeElement.style.display = 'block'; // Affiche un message de succès si nécessaire
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du devoir élève', err);
        this.successMessage = 'Erreur lors de la suppression du devoir élève.';
        this.successModal.nativeElement.style.display = 'block'; // Affiche un message d'erreur si nécessaire
      },
    });
  }
  

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

  onNotesClick() {
    console.log('on click mark');
  }

  enregistrerNotes(): void {
    const notesToSave: EleveDevoirDto[] = [];
    // Iterate over the list of EleveDevoirs and create the corresponding DTOs
    this.eleveDevoirs.forEach(eleveDevoir => {
      const noteValue = this.marks.at(this.eleveDevoirs.indexOf(eleveDevoir))?.value; // Get the corresponding note from FormArray
      const eleveDevoirDto: EleveDevoirDto = {
        idEleveDevoir: eleveDevoir.idEleveDevoir, // Use existing ID if present
        eleve: eleveDevoir.eleve, // Assuming `eleve` is already part of EleveDevoirDto
        devoir: eleveDevoir.devoir, // Assuming you're saving the current devoir
        datePassage: eleveDevoir.datePassage, // Use the selected date
        heurePassage: eleveDevoir.heurePassage, // Use the selected time
        note: noteValue // Get the note value from the form
      };
      notesToSave.push(eleveDevoirDto);
    });
  
    // Send the notes to the service for saving
    const saveObservables: Observable<EleveDevoirDto>[] = notesToSave.map(note =>
      this.elevedevoirService.create(note) // Call the create method for each EleveDevoirDto
    );
  
    // Use forkJoin to wait for all save requests to complete
    forkJoin(saveObservables).subscribe({
      next: (responses) => {
        const successfulSavesCount = responses.length; // Count the number of successful saves
        console.log('Notes enregistrées avec succès:', responses);
        // Show success message or do something else here
        this.successMessage = `Les Date ont été enregistrées avec succès ! Nombre de lignes enregistrées: ${successfulSavesCount}`;
        this.successModal.nativeElement.style.display = 'block'; // Display success modal
      },
      error: (err) => {
        console.error('Erreur lors de l\'enregistrement des notes:', err);
        // Handle error response, show error message if necessary
        this.successMessage = 'Erreur lors de l\'enregistrement des notes. Veuillez réessayer.';
        this.successModal.nativeElement.style.display = 'block'; // Display error modal if necessary
      }
    });
  }

  onGlobalDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newGlobalDate = target.value;

    // Met à jour la date de tous les élèves dans le tableau
    this.eleveDevoirs.forEach((eleve) => {
      if (eleve) {
        // Vérifie que eleve existe
        eleve.datePassage = newGlobalDate; // Applique la nouvelle date globale
      }
    });
  }

// Méthode pour gérer le changement de l'heure globale
onGlobalTimeChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const newGlobalTime = target.value; // La chaîne de temps au format HH:mm

  // Convertir la chaîne en LocalTime
  try {
    const localTime = LocalTime.parse(newGlobalTime);
    // Met à jour l'heure de tous les élèves dans le tableau
    this.eleveDevoirs.forEach(eleve => {
      if (eleve.eleve) { // Vérifie que eleve.eleve existe
        eleve.heurePassage = localTime as unknown as LocalTime; // Applique la nouvelle heure globale
      }
    });
  } catch (error) {
    console.error('Erreur lors de la conversion de l\'heure:', error);
  }
}

  onDateChange(event: Event, eleve: EleveDevoirDto): void {
    const target = event.target as HTMLInputElement;
    eleve.datePassage = target.value; // Mise à jour directe de la datePassage
  }

  // Utilisation dans votre méthode
  onTimeChange(event: Event, eleve: EleveDevoirDto): void {
    const target = event.target as HTMLInputElement;
    const timeString = target.value;

    eleve.heurePassage = this.stringToLocalTime(timeString);
  }

  stringToLocalTime(timeString: string): LocalTime {
    return LocalTime.parse(timeString);
  }

  localTimeToString(localTime: LocalTime): string {
    return localTime.toString(); // Renvoie la chaîne au format "HH:mm"
  }

  closeSuccessModal(): void {
    this.successModal.nativeElement.style.display = 'none'; // Ferme le modal
  }
}
