import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AnneeScolaireDto,
  ClasseDto,
  ClasseEleveDto,
  EleveDto,
  //ClasseService,
  EtablissementDto,
  EtablissementProfesseurDto,
  NiveauDto,
  NiveauService,
  ProfesseurDto,
  SousClasseDto ,
} from '../../api';
import { DevoirService } from '../../services/devoir.service';
import { ClasseService } from '../../services/classe.service';
import { UserProfileService } from '../../services/user-profile-service.service';
import { Observable, of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import { SousclasseService } from '../../services/sousclasse.service';
import { ClasseeleveService } from '../../services/classeeleve.service';
import { EleveService } from '../../services/eleve.service';
import { StudentComponent } from '../student.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-eleve-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './eleve-list.component.html',
  styleUrl: './eleve-list.component.css'
})
export class EleveListComponent implements OnInit {
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
  @ViewChild('successModalClasse') successModal!: TemplateRef<any>; // Ajoute ceci pour référencer le template
  @ViewChild('confirmDeleteModalClasse') confirmDeleteModal!: TemplateRef<any>;
  successMessage: string = '';
  classeEleves: ClasseEleveDto[] = [];
  hasSousClasses: boolean = false;
  openPanelId1: string | null = 'panelContent6'; // For the first card
  openPanelId2: string | null = 'panelContent7'; // For the second card
  idEleve: string | null = null;
  classeEleve: ClasseEleveDto[] = [];
  selectedClasse?: Number | null = null;
  eleveForm!: FormGroup; // Add this line to define the eleveForm
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private eleveService: EleveService,
    private modalService: NgbModal, // Injecter NgbModal
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder, // Inject FormBuilder
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {

    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);

    // Initialize the form in the constructor
    this.eleveForm = this.formBuilder.group({
      classe: [null, Validators.required], // Adjust validators as needed
      // Add other form controls here as needed
    });
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    this.languageService.setLanguageDirection(this.currentLang);
    this.loadUserProfile();
    this.route.queryParams.subscribe(params => {
      //this.niveau = params['niveau'];
      this.idEleve = params['idEleve'];
      console.log( //'Niveau:', this.niveau, 
        'IdEleve:', this.idEleve);
        if (this.idEleve) {
          this.loadClasseEleve(Number(this.idEleve));
        }
    });
  }
  loadClasseEleve(eleveId: number): void {
    this.classeEleveService.findByEleveId(eleveId).subscribe(
      (data: ClasseEleveDto[]) => {
        this.classeEleve = data;
        console.log('Classes trouvées pour l\'élève:', this.classeEleve);
  
        if (this.classeEleve && this.classeEleve.length > 0) {
          // Prendre la première classe trouvée (ou ajuster selon le besoin)
          this.selectedClasse = this.classeEleve[0].classe?.idClasse;
          this.eleveForm.patchValue({ classe: this.selectedClasse }); // Mise à jour du formulaire
        }
      },
      (error) => {
        console.error('Erreur lors de la récupération des classes de l\'élève', error);
      }
    );
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

  loadClasses(): void {
    this.classeService.getAllClasses().subscribe(
      (data) => {
        this.classes = data;
      },
      (error) => {
        console.error('Error fetching classes', error);
      }
    );
  }

  loadSousClasses(): void {
    this.sousclasseService.getSousClasses().subscribe(
      (data) => {
        this.sousClasses = data;
      },
      (error) => {
        console.error('Error fetching sous-classes', error);
      }
    );
  }

  onNiveauChange(event: any): void {
    const selectedNiveauId = event.target.value;
    if (selectedNiveauId) {
      this.classeService.getClassesByNiveau(selectedNiveauId).subscribe(
        (classes: ClasseDto[]) => {
          this.classes = classes;
          if (this.classes.length > 0) {
            this.selectedClasseId = this.classes[0].idClasse ?? null; // Utilisez null si idClasse est undefined
          } else {
            this.selectedClasseId = null;
          }
        },
        (error) => {
          console.error('Erreur lors de la récupération des classes', error);
        }
      );
    } else {
      this.classes = [];
      this.selectedClasseId = null;
    }
  }
  
  loadClassesByNiveau(niveauId: number): void {
    this.classeService.getClassesByNiveau(niveauId).subscribe({
      next: (classes) => this.classes = classes,
      error: (err) => console.error('Erreur lors du chargement des classes', err)
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

  onSousClasseChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  const sousClasseId = target.value;
  
  if (sousClasseId === '') {
    // Si l'utilisateur sélectionne l'option "Choisir une sous-classe", on appelle la méthode pour charger les sous-classes
    this.selectedSousClasseId = null
    if (this.selectedClasseId !== null) {
      this.loadClasseEleves();
    }
  } else {
    this.selectedSousClasseId = Number(sousClasseId);
    console.log(this.selectedSousClasseId);
    this.loadClasseEleves();
  }
}

  loadClasseEleves(): void {
    if (this.selectedClasseId !== null) {
      if (this.selectedSousClasseId !== null) {
        // Si classe et sous-classe sont sélectionnées, charger les deux
        console.log(`Chargement par Classe ID: ${this.selectedClasseId} et SousClasse ID: ${this.selectedSousClasseId}`);
        this.classeEleveService.findByClasseIdAndSousClasseId(this.selectedClasseId, this.selectedSousClasseId).subscribe(
          (data) => {
            this.classeEleves = this.classeEleves = data.sort((a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)); // Sorting by 'num'
            if (this.classeEleves.length === 0) {
              console.warn('Aucune association trouvée pour la classe et sous-classe sélectionnées.');
            }
          },
          (error) => {
            console.error('Erreur lors de la récupération des élèves par classe et sous-classe', error);
          }
        );
      } else {
        // Si la sous-classe est annulée, charger tous les élèves de la classe
        console.log(`Sous-classe annulée. Chargement de tous les élèves de la Classe ID: ${this.selectedClasseId}`);
        this.classeEleveService.findByClasseId(this.selectedClasseId).subscribe(
          (data) => {
            this.classeEleves = this.classeEleves = data.sort((a, b) => (a.eleve?.num ?? 0) - (b.eleve?.num ?? 0)); // Sorting by 'num'
            if (this.classeEleves.length === 0) {
              console.warn('Aucune association trouvée pour la classe sélectionnée.');
            }
          },
          (error) => {
            console.error('Erreur lors de la récupération des élèves par classe', error);
          }
        );
      }
    } else {
      console.warn('Veuillez sélectionner une classe pour charger les élèves.');
      this.classeEleves = []; // Vider la liste si aucune sélection n'est faite
    }
  }

  loadSousClassesByClasseId(classeId: number): void {
    console.log(`Chargement des sous-classes pour la classe ID: ${classeId}`);
    this.sousclasseService.getSousClassesByClasseId(classeId).subscribe(
      (data) => {
        this.sousClasses = data;
        this.hasSousClasses = this.sousClasses.length > 0; // Met à jour la propriété hasSousClasses
        console.log('Sous-classes chargées:', this.sousClasses);
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-classes', error);
      }
    );
  }
  
  
  togglePanel(panelId: string): void {
    if (panelId === 'panelContent6') {
      this.openPanelId1 = this.openPanelId1 ? null : panelId; // Toggle for panel 1
    } else if (panelId === 'panelContent7') {
      this.openPanelId2 = this.openPanelId2 ? null : panelId; // Toggle for panel 2
    }
  }

  isPanelOpen(panelId: string): boolean {
    return (panelId === 'panelContent6' && this.openPanelId1 !== null) ||
           (panelId === 'panelContent7' && this.openPanelId2 !== null);
  }

  // Méthode pour ouvrir le formulaire d'édition d'élève
  onSelectStudent(selectedEleve: EleveDto): void {
    const modalRef = this.modalService.open(StudentComponent, { size: 'lg' });
    modalRef.componentInstance.eleveForm.patchValue(selectedEleve);

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.loadClasseEleves(); // Recharger les élèves après la modification
        }
      },
      (reason) => {
        console.log('Dismissed', reason);
      }
    );
  }

  goToStudent(idEleve: number | undefined): void {
    if (idEleve) {
      this.router.navigate(['/dash//student', idEleve]);
    }
  }

  confirmDelete(classeeleve: ClasseEleveDto, event: MouseEvent): void {
    event.stopPropagation(); // Prevent the row click event
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cet élève et son association ?');
    if (confirmed) {
      this.deleteEleve(classeeleve.idClasseEleve!, classeeleve.eleve?.idEleve);
    }
  }
  
  
  deleteEleve(idClasseEleve: number, eleveId: number | undefined): void {
    this.classeEleveService.delete(idClasseEleve).subscribe(
      () => {
        alert('Association avec l\'élève supprimée avec succès.');
        
        if (eleveId) {
          this.eleveService.delete(eleveId).subscribe(
            () => {
              alert('Élève supprimé avec succès.');
              this.loadClasseEleves(); // Reload the list after deletion
            },
            (error) => {
              console.error('Erreur lors de la suppression de l\'élève', error);
              alert('Erreur lors de la suppression de l\'élève.');
            }
          );
        }
      },
      (error) => {
        console.error('Erreur lors de la suppression de l\'association', error);
        alert('Erreur lors de la suppression de l\'association.');
      }
    );
  }

  deleteEleveDevoir(){
    
  }
  
  
}
