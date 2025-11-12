import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  AnneeScolaireDto,
  ClasseDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  LocalTime,
  NiveauDto,
  NiveauService,
  ProfesseurDto,
  SeanceDto,
  SeanceService,
  SousClasseDto,
} from '../api';
import { UserProfileService } from '../services/user-profile-service.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { ClasseService } from '../services/classe.service';
import { SousclasseService } from '../services/sousclasse.service';

@Component({
  selector: 'app-seance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './seance.component.html',
  styleUrl: './seance.component.css',
})
export class SeanceComponent implements OnInit {
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  selectedClasseId: number | null = null;
  selectedSousClasseId: number | null = null;
  hasSousClasses: boolean = false;
  seanceForm?: FormGroup;
  seances: SeanceDto[] = [];
  classes: ClasseDto[] = [];
  sousClasses: SousClasseDto[] = [];
  jours = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  @ViewChild('successModal') successModal!: ElementRef;
  @ViewChild('confirmDeleteModal') confirmDeleteModal!: ElementRef;
  // Pour garder en mémoire l'id de la séance à supprimer
  idSeanceToDelete: number | null = null;

  constructor(
    private userProfileService: UserProfileService,
    private niveauService: NiveauService,
    private classeService: ClasseService,
    private sousclasseService: SousclasseService,
    private fb: FormBuilder,
    private seanceService: SeanceService
  ) {
    this.seanceForm = this.fb.group({
      idSeance: [null], // Champ caché pour stocker l'id de la séance en mode édition
      classe: [''],
      sousClasse: [''],
      jour: [''],
      heureDebut: [''],
      heureFin: [''],
      typeSeance: [''],
    });
  }

  ngOnInit(): void {
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
            this.loadSeances();
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

  loadSeances(): void {
    console.log(this.professeur?.idProfesseur!);
    this.seanceService
      .findByProfesseurId(this.professeur?.idProfesseur!)
      .subscribe((seances) => (this.seances = seances));
  }

  onClasseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const classeId = target.value;
    this.selectedClasseId = Number(classeId);

    // Réinitialiser les sous-classes et l'ID de sous-classe sélectionnée
    this.sousClasses = [];
    this.selectedSousClasseId = null;

    console.log(this.selectedClasseId);

    // Charger les sous-classes associées à la nouvelle classe
    this.loadSousClassesByClasseId(this.selectedClasseId);
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
        }

        console.log('Sous-classes chargées:', this.sousClasses);
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-classes', error);
      }
    );
  }

  // onSubmitSeanceForm(): void {
  //   if (this.seanceForm?.valid) {
  //     // Récupération des valeurs du formulaire
  //     const formValue = this.seanceForm.value;

  //     // Construction de l'objet SeanceDto avec les IDs et les heures en LocalTime
  //     const seance: SeanceDto = {
  //       idSeance: formValue.idSeance || 0, // Si un idSeance existe, il sera utilisé pour la mise à jour
  //       professeur: {
  //         idProfesseur: this.professeur?.idProfesseur, // Professeur lié
  //       },
  //       classe: {
  //         idClasse: formValue.classe, // Classe choisie
  //       },
  //       sousClasse: {
  //         idSousClasse: formValue.sousClasse, // Sous-classe choisie
  //       },
  //       typeSeance: formValue.typeSeance, // Type de séance
  //       jour: formValue.jour, // Jour sélectionné
  //       heureDebut: formValue.heureDebut, // Heure de début en LocalTime
  //       heureFin: formValue.heureFin, // Heure de fin en LocalTime
  //     };

  //     // Si l'idSeance est défini, c'est une mise à jour, sinon c'est une nouvelle création
  //     if (formValue.idSeance) {
  //       // Mise à jour de la séance existante
  //       this.seanceService.save1(seance).subscribe({
  //         next: () => {
  //           this.loadSeances();
  //           this.resetForm();
  //           this.showSuccessModal();
  //         },
  //         error: (err) => {
  //           console.error('Erreur lors de la mise à jour de la séance', err);
  //         },
  //       });
  //     } else {
  //       // Création d'une nouvelle séance
  //       this.seanceService.save1(seance).subscribe({
  //         next: () => {
  //           this.loadSeances();
  //           this.resetForm();
  //           this.showSuccessModal(); // Affiche le modal de succès
  //         },
  //         error: (err) => {
  //           console.error('Erreur lors de la création de la séance', err);
  //         },
  //       });
  //     }
  //   }
  // }

  onSubmitSeanceForm(): void {
    if (this.seanceForm?.valid) {
      // Récupération des valeurs du formulaire
      const formValue = this.seanceForm.value;
  
      // Construction de l'objet SeanceDto avec les IDs et les heures en LocalTime
      const seance: SeanceDto = {
        idSeance: formValue.idSeance || 0, // Si un idSeance existe, il sera utilisé pour la mise à jour
        professeur: {
          idProfesseur: this.professeur?.idProfesseur, // Professeur lié
        },
        classe: {
          idClasse: formValue.classe, // Classe choisie
        },
        // Si sousClasse est défini, l'assigner, sinon mettre undefined
        sousClasse: formValue.sousClasse ? { idSousClasse: formValue.sousClasse } : undefined,
        typeSeance: formValue.typeSeance, // Type de séance
        jour: formValue.jour, // Jour sélectionné
        heureDebut: formValue.heureDebut, // Heure de début en LocalTime
        heureFin: formValue.heureFin, // Heure de fin en LocalTime
      };
  
      // Si l'idSeance est défini, c'est une mise à jour, sinon c'est une nouvelle création
      if (formValue.idSeance) {
        // Mise à jour de la séance existante
        this.seanceService.save1(seance).subscribe({
          next: () => {
            this.loadSeances();
            this.resetForm();
            this.showSuccessModal();
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour de la séance', err);
          },
        });
      } else {
        // Création d'une nouvelle séance
        this.seanceService.save1(seance).subscribe({
          next: () => {
            this.loadSeances();
            this.resetForm();
            this.showSuccessModal(); // Affiche le modal de succès
          },
          error: (err) => {
            console.error('Erreur lors de la création de la séance', err);
          },
        });
      }
    }
  }
  
  

  // Fonction pour formater l'heure au format HH:mm:ss
  private formatTime(localTime: LocalTime): string {
    const hours = localTime.hour! < 10 ? `0${localTime.hour}` : localTime.hour; // Ajoute un zéro devant si besoin
    const minutes =
      localTime.minute! < 10 ? `0${localTime.minute}` : localTime.minute; // Idem pour les minutes
    const seconds =
      localTime.second! < 10 ? `0${localTime.second}` : localTime.second; // Idem pour les secondes
    return `${hours}:${minutes}:${seconds}`;
  }

  // Fonction pour convertir l'heure en chaîne de caractères au format "HH:mm:ss"
  private convertTimeToString(time: { hour: number; minute: number }): string {
    const hours = String(time.hour).padStart(2, '0');
    const minutes = String(time.minute).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  }

  // Fonction pour convertir l'heure au format LocalTime attendu par l'API
  private convertToLocalTime(timeString: string): LocalTime {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hour: hours, minute: minutes };
  }

  editSeance(seance: SeanceDto): void {
    // Charger les classes et sous-classes correspondant au niveau et à la classe de la séance
    if (seance.classe?.idClasse) {
      this.loadClassesByNiveau(seance.classe.niveau?.idNiveau!);
      this.loadSousClassesByClasseId(seance.classe.idClasse);
    }

    // Remplir les champs du formulaire avec les valeurs de la séance à éditer
    this.seanceForm?.patchValue({
      idSeance: seance.idSeance, // Ajoutez l'ID de la séance pour permettre la mise à jour
      classe: seance.classe?.idClasse || '',
      sousClasse: seance.sousClasse?.idSousClasse || '',
      jour: seance.jour || '',
      heureDebut: seance.heureDebut || '',
      heureFin: seance.heureFin || '',
      typeSeance: seance.typeSeance || '',
    });
  }

  deleteSeance(idSeance: number): void {
    this.seanceService.delete1(idSeance).subscribe(() => this.loadSeances());
  }

  resetForm(): void {
    this.seanceForm?.reset();
  }

  showSuccessModal(): void {
    const modalElement = this.successModal.nativeElement;
    const modalInstance = new (window as any).bootstrap.Modal(modalElement);
    modalInstance.show();
  }
  
  showConfirmDeleteModal(idSeance: number): void {
    this.idSeanceToDelete = idSeance;
    const modalElement = this.confirmDeleteModal.nativeElement;
    const modalInstance = new (window as any).bootstrap.Modal(modalElement);
    modalInstance.show();
  }
  
  // Confirmation de suppression de la séance
  confirmDelete(): void {
    if (this.idSeanceToDelete) {
      this.seanceService.delete1(this.idSeanceToDelete).subscribe(() => {
        this.loadSeances();
        this.idSeanceToDelete = null;
      });
    }
  
    // Fermer la modale de suppression après confirmation
    const modalInstance = (window as any).bootstrap.Modal.getInstance(this.confirmDeleteModal.nativeElement);
    modalInstance.hide();
  }
  
}
