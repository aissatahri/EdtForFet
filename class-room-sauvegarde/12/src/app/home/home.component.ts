import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnneeScolaireDto, ClasseDto, EleveDto, DevoirDto, EtablissementDto, EtablissementProfesseurDto, NiveauDto, NiveauService, PeriodeDto, ProfesseurDto, SousClasseDto, SeanceDto } from '../api';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfileService } from '../services/user-profile-service.service';
import { ClasseService } from '../services/classe.service';
import { SousclasseService } from '../services/sousclasse.service';
import { ClasseeleveService } from '../services/classeeleve.service';
import { DevoirService } from '../services/devoir.service';
import { DevoirEleveService } from '../services/devoir-eleve.service';
import { PeriodeService } from '../services/periode.service';
import { EleveService } from '../services/eleve.service';
import { SeanceService } from '../services/seance.service';
// Import pour votre modèle de DTO (à partir du dossier où vous stockez les DTOs)
import { LocalTime as LocalTimeDto } from '../api/model/localTime'; 
import { LocalTime } from '@js-joda/core';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  periodes: PeriodeDto[] = [];
  devoirs: DevoirDto[] = []; // Liste des années scolaires
  classes: ClasseDto[] = []; // Assurez-vous que cette propriété est définie
  sousClasses: SousClasseDto[] = []; // Ajout de la propriété sousClasses
  classes$: Observable<ClasseDto[]> | undefined;

  totalEleves: number = 0; // Total des élèves
  totalClasses: number = 0; // Nombre total de classes
  showStats: boolean = true;  // Variable pour contrôler l'affichage du panneau "Statistiques"

  timetable: SeanceDto[][] = []; // Timetable structure
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
    private eleveService: EleveService,
    private seanceService: SeanceService, // Inject the SeanceService
    private languageService: LanguageService,
    private translate: TranslateService,  // Injecter TranslateService
){
  this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
}

  ngOnInit(): void {
    // Charger la langue actuelle au démarrage
    this.currentLang = this.languageService.getCurrentLanguage();
    this.languageService.setLanguageDirection(this.currentLang);
    this.loadUserProfile();
    this.loadTimetable();
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
            // console.log(
            //   this.etablissementProfesseur?.idEtablissementProfesseur
            // );

            // console.log(
            //   this.etablissementProfesseur.anneeScolaire?.idAnneeScolaire
            // );
            // console.log(
            //   this.etablissementProfesseur.etablissement?.idEtablissement
            // );
            // console.log(this.etablissementProfesseur.professeur?.idProfesseur);
            this.loadNiveaux();
            this.loadPeriodes(
              this.etablissementProfesseur.idEtablissementProfesseur!
            );
            this.loadTimetable();
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
            // Met à jour le BehaviourSubject avec les niveaux
            this.niveaux$.next(niveaux);
            // Charger les classes pour chaque niveau
            niveaux.forEach((niveau) => {
              this.loadClassesByNiveau(niveau.idNiveau!, niveau);
            });
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des niveaux', err);
          },
        });
    } else {
      console.error("EtablissementProfesseur est vide ou l'ID est invalide.");
    }
  }
  loadClassesByNiveau(idNiveau: number, niveau: NiveauDto): void {
    this.classeService.getClassesByNiveau(idNiveau).subscribe({
      next: (classes) => {
        // Convertir les classes en un Set et l'assigner à l'objet Niveau
        niveau.classes = new Set(classes);
        
        let totalElevesNiveau = 0; // Pour accumuler les élèves dans le niveau
  
        // Calculer le nombre d'élèves pour chaque classe
        classes.forEach((classe) => {
          this.calculateTotalElevesForClasse(classe, (elevesCount: number) => {
            totalElevesNiveau += elevesCount; // Accumuler le total d'élèves dans le niveau
          });
        });
  
        // Mettre à jour les totaux globaux pour tous les niveaux après avoir chargé les classes
        this.updateGlobalTotals();
      },
      error: (err) => {
        console.error(`Erreur lors du chargement des classes pour le niveau ${idNiveau}`, err);
      },
    });
  }
  
  calculateTotalElevesForClasse(classe: ClasseDto, callback: (elevesCount: number) => void): void {
    this.classeEleveService.findByClasseId(classe.idClasse!).subscribe({
      next: (eleves) => {
        classe.nombreEleve = eleves.length;  // Assigner le nombre d'élèves à chaque classe
        callback(eleves.length);  // Passer le nombre d'élèves via le callback
      },
      error: (err) => {
        console.error('Erreur lors du chargement des élèves pour la classe', err);
      },
    });
  }
  
  // Mise à jour des totaux globaux
  updateGlobalTotals(): void {
    let totalClasses = 0;
    let totalEleves = 0;
  
    // Parcourir tous les niveaux et calculer les totaux dynamiquement
    this.niveaux$.getValue().forEach(niveau => {
      const niveauClasses = Array.from(niveau.classes || []);
      totalClasses += niveauClasses.length; // Ajouter le nombre de classes du niveau
      niveauClasses.forEach(classe => {
        totalEleves += classe.nombreEleve || 0; // Ajouter le nombre d'élèves pour chaque classe
      });
    });
  
    this.totalClasses = totalClasses; // Mettre à jour le total des classes
    this.totalEleves = totalEleves;   // Mettre à jour le total des élèves
  }

  getTotalElevesForNiveau(niveau: NiveauDto): number {
    if (!niveau.classes) {
      return 0;
    }
  
    // Convertir Set<ClasseDto> en tableau, puis calculer la somme des élèves
    return Array.from(niveau.classes).reduce((total, classe) => {
      return total + (classe.nombreEleve || 0);
    }, 0);
  }
  



  
  // loadClassesByNiveau(idNiveau: number, niveau: NiveauDto): void {
  //   this.classeService.getClassesByNiveau(idNiveau).subscribe({
  //     next: (classes) => {
  //       // Convertir le tableau de classes en Set avant de l'assigner
  //       niveau.classes = new Set(classes);
        
  //       // Calculer le nombre total d'élèves pour chaque classe
  //       classes.forEach((classe) => {
  //         this.calculateTotalElevesForClasse(classe);
  //       });
  //     },
  //     error: (err) => {
  //       console.error(`Erreur lors du chargement des classes pour le niveau ${idNiveau}`, err);
  //     },
  //   });
  // }
  

  // private calculateTotalElevesForClasse(classe: ClasseDto): void {
  //   this.classeEleveService.findByClasseId(classe.idClasse!).subscribe({
  //     next: (eleves) => {
  //       // Ajouter le nombre d'élèves à la classe correspondante
  //       classe['nombreEleve'] = eleves.length;
  //       // Mettre à jour le nombre total d'élèves
  //       this.totalEleves += eleves.length;
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors du chargement des élèves', err);
  //     },
  //   });
  // }
  
  

  loadPeriodes(etablissementProfesseurId: number): void {
    // console.log(
    //   'etablissementProfesseurId --------->' + etablissementProfesseurId
    // );
    this.periodeService
      .getPeriodesByEtablissementProfesseurId(etablissementProfesseurId)
      .subscribe(
        (periodes: PeriodeDto[]) => {
          this.periodes = periodes; // Mettre à jour la liste des périodes
          // if (currentPeriode) {
          //   this.formGroup.get('periode')?.setValue(currentPeriode.idPeriode);
          // }
        },
        (error) => {
          console.error('Erreur lors du chargement des périodes', error);
        }
      );
  }

  // Charger les sous-classes
  private loadSousClasses(): void {
    this.sousclasseService.getSousClasses().subscribe({
      next: (sousClasses) => {
        this.sousClasses = sousClasses;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sous-classes', err);
      },
    });
  }

  // Calculer le nombre total des élèves
  private calculateTotalEleves(): void {
    let totalEleves = 0;

    this.classes.forEach((classe) => {
      this.classeEleveService.findByClasseId(classe.idClasse!).subscribe({
        next: (eleves) => {
          classe['nombreEleve'] = eleves.length;  // Ajout du nombre d'élèves à chaque classe
          totalEleves += eleves.length;
          this.totalEleves = totalEleves;  // Mettre à jour le total des élèves
        },
        error: (err) => {
          console.error('Erreur lors du chargement des élèves', err);
        },
      });
    });
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
  }

  // Load the timetable based on the professor's ID
  private loadTimetable(): void {
    if (this.professeur) {
      // console.log(this.professeur)
      this.seanceService.findByProfesseurId(this.professeur.idProfesseur!).subscribe({
        next: (seances) => {
          // console.log(seances)
          this.timetable = this.createTimetable(seances);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des séances', error);
        }
      });
    }
  }

  private createTimetable(seances: SeanceDto[]): SeanceDto[][] {
    const timetable: SeanceDto[][] = Array.from({ length: 7 }, () => Array(8).fill(null)); // 7 jours, 8 créneaux horaires
  
    // Créneaux horaires définis (au format chaîne de caractères)
    const timeSlots = [
      '08:30',
      '09:30',
      '10:30',
      '11:30',
      '14:30',
      '15:30',
      '16:30',
      '17:30'
    ];
  
    // Mapping des séances dans l'emploi du temps
    seances.forEach(seance => {
      const dayIndex = this.getDayIndex(seance.jour!); // Obtenir l'index du jour (0 pour lundi à 6 pour dimanche)
  
      // Conversion de LocalTimeDto (venant du DTO) en LocalTime (@js-joda/core)
      const heureDebutJsJoda: LocalTime = LocalTime.parse(seance.heureDebut!.toString()); 
  
      const timeSlotIndex = this.getTimeSlotIndex(heureDebutJsJoda); // Utiliser l'heure convertie en LocalTime
  
      if (dayIndex !== -1 && timeSlotIndex !== -1) {
        timetable[dayIndex][timeSlotIndex] = seance; // Assigner la séance dans le créneau approprié
      }
    });
  
    return timetable;
  }

private getTimeSlotIndex(heureDebut?: LocalTime): number {
    if (!heureDebut) {
        return -1; // Return -1 if heureDebut is undefined
    }

    // Convert LocalDateTime to string in HH:mm format
    const timeString = heureDebut.toString().substring(0, 5); // Adjust according to how you get the time
    const timeSlots = [
      '08:30',
      '09:30',
      '10:30',
      '11:30',
      '14:30',
      '15:30',
      '16:30',
      '17:30'
    ];

    return timeSlots.indexOf(timeString);
}


  private getDayIndex(jour: SeanceDto.JourEnum): number {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    return days.indexOf(jour);
  }

  currentDate = new Date();

  // Fonction pour vérifier si une séance est en cours
   isCurrentSession(timeSlot: any, day: string): boolean {
    if (!timeSlot) return false;

    // Obtenir le jour actuel
    const today = this.currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    // Vérifier si le jour correspond
    if (today !== day) return false;

    const now = LocalTime.now();
    const heureDebut = LocalTime.parse(timeSlot.heureDebut.toString());
    const heureFin = LocalTime.parse(timeSlot.heureFin.toString());

    return now.isAfter(heureDebut) && now.isBefore(heureFin);
}


  
  

  // private getTimeSlotIndex(heureDebut: LocalTime): number {
  //   const timeSlots = [
  //     '08:30',
  //     '09:30',
  //     '10:30',
  //     '11:30',
  //     '14:30',
  //     '15:30',
  //     '16:30',
  //     '17:30'
  //   ];

  //   const timeString = heureDebut?.toString().substring(0, 5); // Get the string representation of the time
  //   return timeSlots.indexOf(timeString);
  // }

  // Ajoutez cette méthode dans votre HomeComponent
getTotalSessionsForDay(dayIndex: number): number {
  return this.timetable[dayIndex].filter(seance => seance !== null).length;
}

// Ajoutez cette méthode dans votre HomeComponent
getTotalSessionsForWeek(): number {
  let totalSessions = 0;
  this.timetable.forEach(day => {
    totalSessions += day.filter(seance => seance !== null).length;
  });
  return totalSessions;
}


}
