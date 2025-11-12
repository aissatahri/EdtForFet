import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import {
  AbsenceDto,
  AnneeScolaireDto,
  ClasseDto,
  ClasseEleveDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  NiveauDto,
  NiveauService,
  PeriodeDto,
  ProfesseurDto,
} from '../../api';
import { AbsenceService } from '../../services/absence.service';
import { UserProfileService } from '../../services/user-profile-service.service';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { PeriodeService } from '../../services/periode.service';
import { ClasseeleveService } from '../../services/classeeleve.service';
import { ClasseService } from '../../services/classe.service';
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-list-absence',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './list-absence.component.html',
  styleUrl: './list-absence.component.css',
})
export class ListAbsenceComponent implements OnInit {
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  periodes: PeriodeDto[] = [];
  absences: AbsenceDto[] = [];
  filteredAbsences: AbsenceDto[] = [];
  filterDate: string = '';
  filterName: string = '';
  filterPeriod: number | null = null; // Assuming period is an ID or similar
  selectedAbsence: AbsenceDto | null = null;
  filterClasse: number | null = null; // ID de la classe sélectionnée
  classes: ClasseDto[] = [];
  classes$: Observable<ClasseDto[]> | undefined;
  classesEleves : string[] = [];
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private userProfileService: UserProfileService,
    private niveauService: NiveauService,
    private periodeService: PeriodeService,
    private absenceService: AbsenceService,
    private classeeleveService: ClasseeleveService,
    private classeService: ClasseService,
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
    this.loadUserProfile();
    this.loadClasses();
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
            const niveauIds = niveaux
              .map((niveau) => niveau.idNiveau)
              .filter((idNiveau): idNiveau is number => idNiveau !== undefined); // Filtre pour éliminer les valeurs undefined
            if (niveauIds.length > 0) {
              this.loadClassesForAllNiveaux(niveauIds);
            }
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des niveaux', err);
          },
        });
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }

  loadClassesForAllNiveaux(niveauIds: number[]): void {
    const classRequests = niveauIds.map((idNiveau) =>
      this.classeService.getClassesByNiveau(idNiveau)
    );

    forkJoin(classRequests).subscribe({
      next: (allClasses) => {
        this.classes = allClasses.flat();
        console.log('Classes récupérées pour tous les niveaux :', this.classes);
      },
      error: (err) => {
        console.error(
          'Erreur lors de la récupération des classes pour tous les niveaux',
          err
        );
      },
    });
  }

  loadClasses(): void {
    this.classeeleveService.findAll().subscribe(
      (classeEleves: ClasseEleveDto[]) => {
        // Mappez pour obtenir uniquement les libellés
        this.classesEleves = classeEleves
          .map((classeEleve) => classeEleve.classe?.libelle)
          .filter((libelle): libelle is string => libelle !== undefined); // Filtre les valeurs undefined
      },
      (error) => {
        console.error('Erreur lors du chargement des classes', error);
      }
    );
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
          this.loadAbsences(); // Charger toutes les absences initialement
        },
        (error) => {
          console.error('Erreur lors du chargement des périodes', error);
        }
      );
  }
 

  loadAbsences(): void {
    const selectedPeriodId = this.filterPeriod || this.getCurrentPeriode()?.idPeriode!;
  
    this.absenceService.findByPeriodeId(selectedPeriodId).subscribe(
      (data: AbsenceDto[]) => {
        this.absences = data;
  
        // Dictionnaire pour mapper les motifs à leurs clés de traduction
        const motifMapping: { [key: string]: string } = {
          'Absence non justifiée': 'MOTIF_NON_JUSTIFIE',
          'Absence justifiée': 'MOTIF_JUSTIFIE',
          'Absence pour raison médicale': 'MOTIF_MEDICAL'
        };
  
        // Pour chaque absence, traduire le motif ou utiliser un motif par défaut
        this.absences.forEach(absence => {
          if (absence.motif && motifMapping[absence.motif]) {
            // Utiliser la clé mappée pour la traduction
            const translationKey = 'ABSENCES.' + motifMapping[absence.motif];
  
            // Récupérer la traduction associée à la clé en fonction de la langue actuelle
            this.translate.get(translationKey).subscribe(
              (translatedMotif: string) => {
                absence.motif = translatedMotif; // Remplacer le motif par la traduction
              },
              (error) => {
                console.error(`Erreur lors de la traduction pour la clé ${translationKey}`, error);
                absence.motif = this.translate.instant('ABSENCES.MOTIF_NON_DEFINI'); // Valeur par défaut "Motif non défini"
              }
            );
          } else {
            // Utiliser la valeur par défaut "MOTIF_NON_DEFINI" si le motif est inconnu ou absent
            this.translate.get('ABSENCES.MOTIF_NON_DEFINI').subscribe(
              (translatedMotif: string) => {
                absence.motif = translatedMotif; // Utiliser "Motif non défini" ou "سبب غير محدد"
              },
              (error) => {
                console.error('Erreur lors de la récupération de la traduction pour MOTIF_NON_DEFINI', error);
                absence.motif = this.translate.instant('ABSENCES.MOTIF_NON_DEFINI'); // Valeur par défaut en cas d'erreur
              }
            );
          }
        });
  
        this.filteredAbsences = data; // Initialiser avec toutes les absences
  
        // Charger les classes des élèves en utilisant forkJoin pour optimiser les requêtes
        const classRequests = this.absences
          .filter((absence) => absence.eleve?.idEleve)
          .map((absence) => this.classeeleveService.findByEleveId(absence.eleve!.idEleve!));
  
        forkJoin(classRequests).subscribe((classesEleve: ClasseEleveDto[][]) => {
          classesEleve.forEach((classeEleves, index) => {
            if (classeEleves.length > 0) {
              this.absences[index].classeEleve = classeEleves[0]; // Associe la première classe trouvée
            }
          });
  
          // Appliquer le filtrage après chargement
          this.filterAbsences();
        });
      },
      (error) => {
        console.error('Erreur lors du chargement des absences', error);
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

  filterByDate(): void {
    if (this.filterDate) {
      this.filteredAbsences = this.absences.filter((absence) => {
        const absenceDate = new Date(absence.date!); // Convert absence date to Date object
        const filterDate = new Date(this.filterDate); // Convert filter date to Date object
        return absenceDate.toDateString() === filterDate.toDateString(); // Compare only the date part
      });
    } else {
      this.filteredAbsences = this.absences; // Reset if no filter
    }
  }

  editAbsence(id: number): void {
    console.log(id);
    this.absenceService.findById(id).subscribe(
      (data: AbsenceDto) => {
        this.selectedAbsence = data; // Load the selected absence into the form
        console.log('Fonction edit : ', this.selectedAbsence.idAbsence);
      },
      (error) => {
        console.error('Erreur lors du chargement abscence', error);
      }
    );
  }

  updateAbsence(): void {
    if (this.selectedAbsence) {
      const updatedAbsence: AbsenceDto = {
        idAbsence: this.selectedAbsence.idAbsence, // The ID remains unchanged
        eleve: this.selectedAbsence.eleve, // The student remains unchanged
        date: this.selectedAbsence.date, // The date could be updated by the form
        heure: this.selectedAbsence.heure, // The time could be updated by the form
        motif: this.selectedAbsence.motif, // The reason (motif) could be updated by the form
        periode: this.selectedAbsence.periode, // The period could be updated by the form
      };

      console.log('Fonction update : ', updatedAbsence);

      this.absenceService.createAbsence(updatedAbsence).subscribe(
        () => {
          alert('Absence mise à jour avec succès.');
          this.loadAbsences(); // Reload absences after update
          this.selectedAbsence = null; // Clear the selected absence
        },
        (error) => {
          console.error('Erreur lors de la mise à jour', error);
          alert('Erreur lors de la mise à jour.');
        }
      );
    }
  }

  cancelEdit(): void {
    this.selectedAbsence = null; // Clear selected absence
  }

  deleteAbsence(id: number): void {
    // Logic to delete the absence
    if (confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      this.absenceService.deleteById(id).subscribe(
        () => {
          this.loadAbsences(); // Reload absences after deletion
          alert('Absence supprimée avec succès.');
        },
        (error) => {
          console.error('Erreur lors de la suppression', error);
          alert('Erreur lors de la suppression.');
        }
      );
    }
  }

  filterAbsences(): void {
    this.filteredAbsences = this.absences.filter((absence) => {
      const absenceDate = new Date(absence.date!);
      const filterDate = this.filterDate ? new Date(this.filterDate) : null;
  
      const matchesDate = this.filterDate
        ? absenceDate.toDateString() === filterDate!.toDateString()
        : true;
  
      const matchesName = this.filterName
        ? absence.eleve?.nom!.toLowerCase().includes(this.filterName.toLowerCase())
        : true;
  
      const matchesPeriod = this.filterPeriod
        ? absence.periode?.idPeriode === +this.filterPeriod
        : true;
  
      const matchesClass = this.filterClasse
        ? typeof absence.classeEleve?.classe?.libelle === 'string' &&
          absence.classeEleve?.classe?.libelle!.toLowerCase().includes(this.filterClasse.toString().toLowerCase()) // Convertir la classe à chaîne si nécessaire
        : true;
  
      return matchesDate && matchesName && matchesPeriod && matchesClass;
    });
  }
  
}
