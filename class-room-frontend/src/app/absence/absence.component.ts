import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AbsenceDto,
  AnneeScolaireDto,
  ClasseDto,
  ClasseEleveDto,
  EleveDto,
  //ClasseService,
  EtablissementDto,
  EtablissementProfesseurDto,
  NiveauDto,
  NiveauService,
  PeriodeDto,
  ProfesseurDto,
  SousClasseDto,
} from '../api';
import { ClasseService } from '../services/classe.service';
import { UserProfileService } from '../services/user-profile-service.service';
import { Observable, of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import { SousclasseService } from '../services/sousclasse.service';
import { ClasseeleveService } from '../services/classeeleve.service';
import { EleveService } from '../services/eleve.service';
import { Router, RouterModule } from '@angular/router';
import { PeriodeService } from '../services/periode.service';
import { AbsenceService } from '../services/absence.service';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-absence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './absence.component.html',
  styleUrl: './absence.component.css',
})
export class AbsenceComponent implements OnInit {
  formGroup: FormGroup;
  periodes: PeriodeDto[] = []; // Liste des années scolaires
  classes: ClasseDto[] = []; // Assurez-vous que cette propriété est définie
  sousClasses: SousClasseDto[] = []; // Ajout de la propriété sousClasses
  selectedClasseId: number | null = null;
  selectedSousClasseId: number | null = null;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  niveauId!: number;
  classes$: Observable<ClasseDto[]> | undefined;
  isEditing: boolean = false;
  currentClasse: ClasseDto | null = null;
  @ViewChild('successModal', { static: true })
  successModal!: ElementRef<HTMLDivElement>;
  // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalClasse') confirmDeleteModal!: TemplateRef<any>;
  successMessage: string = '';
  classeEleves: ClasseEleveDto[] = [];
  hasSousClasses: boolean = false;
  openPanelId1: string | null = 'panelContent6'; // For the first card
  openPanelId2: string | null = 'panelContent7'; // For the second card
  absences: { [key: number]: boolean } = {}; // Gestion des absences
  @ViewChild('absenceModal') absenceModal!: ElementRef;
  selectedDate: string = ''; // Pour stocker la date sélectionnée
  selectedTime: string = ''; // Pour stocker l'heure sélectionnée
  currentLang: string = 'fr'; // Langue par défaut
// Déclare une variable pour suivre si une case est cochée
atLeastOneChecked: boolean = false;
  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private eleveService: EleveService,
    private periodeService: PeriodeService,
    private modalService: NgbModal, // Injecter NgbModal
    private absenceService: AbsenceService,
    private router: Router, 
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    this.formGroup = this.fb.group({
      periode: [null, Validators.required], // Ajouter le contrôle pour la période
      niveau: [null, Validators.required],
      classe: [null, Validators.required],
      sousClasse: [null],
      absences: this.fb.array([]), // Initialise le FormArray pour gérer les absences
    });

    // Initialize selectedDate with the current date in YYYY-MM-DD format
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0]; // Gets the date in YYYY-MM-DD format
    // Initialize selectedTime with the current time in HH:MM format
    this.selectedTime = today.toTimeString().split(' ')[0].slice(0, 5); // Gets the time in HH:MM format
    this.router.events.subscribe(event => {
      console.log(event); // Log the events to the console
    });
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
    this.loadUserProfile();
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
          if (currentPeriode) {
            this.formGroup.get('periode')?.setValue(currentPeriode.idPeriode);
          }
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
    this.loadClasseEleves();

    // Charger les sous-classes associées à la nouvelle classe
    this.loadSousClassesByClasseId(this.selectedClasseId);
  }

  loadClasseEleves(): void {
    const absencesArray = this.formGroup.get('absences') as FormArray;
    absencesArray.clear(); // Réinitialisation du FormArray à chaque chargement d'élèves

    if (this.selectedClasseId !== null) {
      if (this.selectedSousClasseId !== null) {
        // Si classe et sous-classe sont sélectionnées, charger les deux
        console.log(
          `Chargement par Classe ID: ${this.selectedClasseId} et SousClasse ID: ${this.selectedSousClasseId}`
        );
        this.classeEleveService
          .findByClasseIdAndSousClasseId(
            this.selectedClasseId,
            this.selectedSousClasseId
          )
          .subscribe(
            (data) => {
              this.classeEleves = this.classeEleves = data.sort((a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)); // Sorting by 'num'
              this.populateAbsencesArray(); // Remplir le FormArray après la récupération des élèves
            },
            (error) => {
              console.error(
                'Erreur lors de la récupération des élèves par classe et sous-classe',
                error
              );
            }
          );
      } else {
        // Si la sous-classe est annulée, charger tous les élèves de la classe
        console.log(
          `Sous-classe annulée. Chargement de tous les élèves de la Classe ID: ${this.selectedClasseId}`
        );
        this.classeEleveService.findByClasseId(this.selectedClasseId).subscribe(
          (data) => {
            this.classeEleves = this.classeEleves = data.sort((a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)); // Sorting by 'num'
            this.populateAbsencesArray(); // Remplir le FormArray après la récupération des élèves
          },
          (error) => {
            console.error(
              'Erreur lors de la récupération des élèves par classe',
              error
            );
          }
        );
      }
    } else {
      console.warn('Veuillez sélectionner une classe pour charger les élèves.');
      this.classeEleves = []; // Vider la liste si aucune sélection n'est faite
      absencesArray.clear(); // Vider aussi les absences
    }
  }

  // Nouvelle méthode pour remplir le FormArray avec des contrôleurs
  populateAbsencesArray(): void {
    const absencesArray = this.formGroup.get('absences') as FormArray;

    this.classeEleves.forEach(() => {
      absencesArray.push(new FormControl(false)); // Ajouter une case à cocher pour chaque élève
    });
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

  getAbsenceControlName(eleveId: number): string {
    return `absence_${eleveId}`;
  }

  trackByEleve(index: number, classeeleve: ClasseEleveDto): number {
    return classeeleve.eleve?.idEleve!;
  }

  getAbsenceControl(index: number): FormControl {
    const absencesArray = this.formGroup.get('absences') as FormArray;
    return absencesArray.at(index) as FormControl;
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

  openModal() {
    const modalElement = this.absenceModal.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.classList.add('modal-backdrop', 'fade', 'show');
      document.body.appendChild(backdrop);
    }
  }

  // Méthode pour soumettre le modal
  onModalSubmit() {
    if (!this.selectedDate || !this.selectedTime) {
      console.error("La date ou l'heure n'a pas été sélectionnée.");
      return;
    }

    // Fermer le modal Bootstrap
    const modalElement = this.absenceModal.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      const modalBackdrop = document.querySelector('.modal-backdrop');
      if (modalBackdrop) {
        modalBackdrop.remove();
      }
    }

    // Appeler la méthode pour soumettre les absences et passer la date et l'heure
    this.submitAbsences(this.selectedDate, this.selectedTime);
  }

 // Méthode pour afficher le modal de succès
showSuccessModal() {
  if (this.successModal && this.successModal.nativeElement) {
    this.successModal.nativeElement.classList.add('show');
    this.successModal.nativeElement.style.display = 'block';
    this.successModal.nativeElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    // Vérifier si le backdrop n'est pas déjà présent avant de l'ajouter
    if (!document.querySelector('.modal-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  } else {
    console.error('successModal is not defined.');
  }
}

 // Méthode pour fermer le modal de succès
closeSuccessModal() {
  if (this.successModal && this.successModal.nativeElement) {
    this.successModal.nativeElement.classList.remove('show');
    this.successModal.nativeElement.style.display = 'none';
    this.successModal.nativeElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    // Supprimer le backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  } else {
    console.error('successModal is not defined.');
  }
}
  // Méthode pour fermer le modal
  closeModal() {
    if (this.absenceModal && this.absenceModal.nativeElement) {
      this.absenceModal.nativeElement.classList.remove('show');
      this.absenceModal.nativeElement.style.display = 'none';
      this.absenceModal.nativeElement.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      // Retirer le backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }

  submitAbsences(date: string, time: string) {
    let i = 0;
    const selectedPeriodId = this.formGroup.get('periode')?.value;

    // Vérifier si une période est sélectionnée
    if (!selectedPeriodId) {
      console.error('Aucune période sélectionnée');
      return;
    }

    // Récupérer la période sélectionnée par son ID
    this.periodeService.getPeriodeById(selectedPeriodId).subscribe({
      next: (periodeSelct: PeriodeDto) => {
        const absents = this.classeEleves.filter(
          (eleve) => eleve.eleve?.isAbsent
        );

        if (absents.length === 0) {
          console.log('Aucun élève absent à soumettre.');
          return;
        }

        // Utiliser TranslateService pour traduire le motif d'absence
        this.translate.get('ABSENCES.MOTIF_NON_DEFINI').subscribe((translatedMotif: string) => {
          const absences: AbsenceDto[] = absents.map((classeEleve): AbsenceDto => {
            return {
              eleve: {
                idEleve: classeEleve.eleve?.idEleve,
                code: classeEleve.eleve?.code,
                num: classeEleve.eleve?.num,
                nom: classeEleve.eleve?.nom,
                dateNaissance: classeEleve.eleve?.dateNaissance,
                gender: classeEleve.eleve?.gender === 'MALE'
                  ? EleveDto.GenderEnum.Male
                  : EleveDto.GenderEnum.Female,
                photo: classeEleve.eleve?.photo,
              },
              date: date, // Date sélectionnée
              heure: time, // Heure sélectionnée
              motif: translatedMotif, // Motif traduit
              periode: periodeSelct, // Période sélectionnée
            };
          });

          // Afficher la liste des absences pour vérification
          console.log('Absences à soumettre :', absences);
          i++;
          let j = 0;

          // Soumettre chaque absence individuellement
          absences.forEach((absence) => {
            this.absenceService.createAbsence(absence).subscribe({
              next: (response) => {
                console.log('Absence enregistrée avec succès :', response);
                this.showSuccessModal(); // Afficher le modal de succès
              },
              error: (err) => {
                console.error("Erreur lors de la soumission de l'absence :", err);
              },
            });
            j++;
          });
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la période :', err);
      },
    });
  }

  getCurrentTime(): string {
    const now = new Date();

    // Obtenir les heures, minutes et secondes en utilisant les méthodes de temps local
    const hours = now.getHours().toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`; // Format 'HH:mm:ss'
  }

  page: number = 1; // Page actuelle
  itemsPerPage: number = 10; // Nombre d'éléments par page
  totalItems: number = 0; // Total des éléments

  getPaginatedClasseEleves(): ClasseEleveDto[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.classeEleves.slice(startIndex, endIndex);
  }
  get totalPages(): number {
    return Math.ceil(this.classeEleves.length / this.itemsPerPage);
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    }
  }

  onAbsenceChange(eleve: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    // Met à jour la propriété isAbsent de l'élève
    eleve.isAbsent = isChecked;
  
    // Met à jour l'état pour savoir si au moins une case est cochée
    // Vérifie si au moins un élève est absent dans la liste
    this.atLeastOneChecked = this.classeEleves.some(classeeleve => classeeleve.eleve?.isAbsent);
  }

  onAbsencesClick(): void {
    console.log('Absences button clicked');
  }
  
  
}
