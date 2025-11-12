import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnneeScolaireDto, ClasseDto, ClasseEleveDto, ContenuDto, EtablissementDto, EtablissementProfesseurDto, NiveauDto, NiveauService, ProfesseurDto, SeanceDto, SousClasseDto } from '../api';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfileService } from '../services/user-profile-service.service';
import { ClasseService } from '../services/classe.service';
import { SousclasseService } from '../services/sousclasse.service';
import { ClasseeleveService } from '../services/classeeleve.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContenuService } from '../services/contenu.service';
import { SeanceService } from '../services/seance.service';
import { EditorModule } from '@tinymce/tinymce-angular';
@Component({
  selector: 'app-cahiertexte',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, EditorModule],
  templateUrl: './cahiertexte.component.html',
  styleUrls: ['./cahiertexte.component.css'] // Notez le correctif ici
})
export class CahiertexteComponent implements OnInit {
  classes: ClasseDto[] = [];
  sousClasses: SousClasseDto[] = [];
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
  @ViewChild('successModalClasse') successModal!: TemplateRef<any>;
  @ViewChild('confirmDeleteModalClasse') confirmDeleteModal!: TemplateRef<any>;
  successMessage: string = '';
  classeEleves: ClasseEleveDto[] = [];
  hasSousClasses: boolean = false;
  openPanelId1: string | null = 'panelContent6'; 
  openPanelId2: string | null = 'panelContent7'; 
  contenuForm!: FormGroup;
  seances: SeanceDto[] = [];
  selectedSeanceId: number | null = null;
  contents: ContenuDto[] = []; // New property for storing content
   // Modify this line to allow null
   editingContentId: number | null = null; // Track the content being edited

  
  constructor(
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private contenuService: ContenuService,
    private seanceService: SeanceService
  ) {
    this.contenuForm = this.formBuilder.group({
      contenu: ['', Validators.required], // Le champ contenu est obligatoire
      date: ['', Validators.required],
      heure: ['', Validators.required],
      seanceId: ['', Validators.required], // ID de la séance sélectionnée
      richText: [''] // New field for rich text editor
    });
    
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadContentsForSeance();
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
            this.loadSeances(this.professeur?.idProfesseur!);
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
            const firstNiveau = niveaux[0];
            if (firstNiveau && firstNiveau.idNiveau !== undefined) {
              // this.loadClassesByNiveau(firstNiveau.idNiveau);
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

  onNiveauChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const niveauId = target.value ? parseInt(target.value) : null;

    if (niveauId) {
      this.loadClassesByNiveau(niveauId);
    } else {
      this.classes = [];
      this.sousClasses = [];
    }
  }

  loadClassesByNiveau(niveauId: number): void {
    this.classeService.getClassesByNiveau(niveauId).subscribe({
      next: (classes) => this.classes = classes,
      error: (err) => console.error('Erreur lors du chargement des classes', err)
    });
  }

//  // Load sessions when a class is selected
//  onClasseChange(event: Event): void {
//   const target = event.target as HTMLSelectElement;
//   const classeId = target.value;
//   this.selectedClasseId = Number(classeId);

//   this.sousClasses = [];
//   this.selectedSousClasseId = null;

//   // Load sous-classes if applicable
//   this.loadSousClassesByClasseId(this.selectedClasseId);
  
//   // Load sessions for the selected class
//   this.loadSeancesByClasseId(this.selectedClasseId);
// }

// Load sessions when a subclass is selected

// Update method to handle class selection and load content
onClasseChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  const classeId = Number(target.value);
  this.selectedClasseId = classeId;

  this.sousClasses = [];
  this.selectedSousClasseId = null;

  this.loadSousClassesByClasseId(classeId); // Load sous-classes
  this.loadSeancesByClasseId(classeId); // Load seances and corresponding content
}




// onSousClasseChange(event: Event): void {
//   const target = event.target as HTMLSelectElement;
//   const sousClasseId = target.value;

//   this.selectedSousClasseId = sousClasseId ? Number(sousClasseId) : null;

//   // Load sessions for the selected subclass
//   if (this.selectedSousClasseId) {
//     this.loadSeancesBySousClasseId(this.selectedSousClasseId);
//   }
// }

// Load sessions based on the selected class
// loadSeancesByClasseId(classeId: number): void {
//   this.seanceService.findByClasseId(classeId).subscribe({
//     next: (seances) => {
//       this.seances = seances;
//       console.log('Sessions loaded for class ID:', classeId, this.seances);
//     },
//     error: (error) => {
//       console.error('Error loading sessions by class ID', error);
//     }
//   });
// }

 // Update method to handle subclass selection and load content
 
 onSousClasseChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  const sousClasseId = Number(target.value);
  this.selectedSousClasseId = sousClasseId;

  if (this.selectedSousClasseId) {
    this.loadSeancesBySousClasseId(this.selectedSousClasseId); // Load seances and corresponding content
  }
}


// Load sessions based on the selected subclass
// loadSeancesBySousClasseId(sousClasseId: number): void {
//   this.seanceService.findBySousClasseId(sousClasseId).subscribe({
//     next: (seances) => {
//       this.seances = seances;
//       console.log('Sessions loaded for subclass ID:', sousClasseId, this.seances);
//     },
//     error: (error) => {
//       console.error('Error loading sessions by subclass ID', error);
//     }
//   });
// }

// Load seances by class and then load contents for each seance
loadSeancesByClasseId(classeId: number): void {
  this.seanceService.findByClasseId(classeId).subscribe({
    next: (seances) => {
      this.seances = seances;
      this.loadContentsForSeances(seances); // Load content for the retrieved seances
    },
    error: (error) => console.error('Error loading seances by class', error)
  });
}

loadSeancesBySousClasseId(sousClasseId: number): void {
  this.seanceService.findBySousClasseId(sousClasseId).subscribe({
    next: (seances) => {
      this.seances = seances;
      this.loadContentsForSeances(seances); // Load content for the retrieved seances
    },
    error: (error) => console.error('Error loading seances by subclass', error)
  });
}

// Method to load contents for each seance
loadContentsForSeances(seances: SeanceDto[]): void {
  this.contents = []; // Reset contents
  seances.forEach((seance) => {
    this.contenuService.findBySeanceId(seance.idSeance!).subscribe({
      next: (contents) => {
        this.contents.push(...contents); // Append contents to the list
      },
      error: (error) => console.error('Error loading contents for seance', error)
    });
  });
}


  loadSousClassesByClasseId(classeId: number): void {
    console.log(`Chargement des sous-classes pour la classe ID: ${classeId}`);
    this.sousclasseService.getSousClassesByClasseId(classeId).subscribe(
      (data) => {
        this.sousClasses = data;
        this.hasSousClasses = this.sousClasses.length > 0; 
        console.log('Sous-classes chargées:', this.sousClasses);
      },
      (error) => {
        console.error('Erreur lors du chargement des sous-classes', error);
      }
    );
  }

  togglePanel(panelId: string): void {
    if (panelId === 'panelContent6') {
      this.openPanelId1 = this.openPanelId1 ? null : panelId;
    } else if (panelId === 'panelContent7') {
      this.openPanelId2 = this.openPanelId2 ? null : panelId;
    }
  }

  isPanelOpen(panelId: string): boolean {
    return (panelId === 'panelContent6' && this.openPanelId1 !== null) ||
           (panelId === 'panelContent7' && this.openPanelId2 !== null);
  }

  // Charger les séances pour permettre à l'utilisateur de sélectionner une séance
  private loadSeances(id: number) {
    this.seanceService.findByProfesseurId(id).subscribe({
      next: (seances) => {
        this.seances = seances;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des séances', error);
      }
    });
  }

  editContent(contenu: ContenuDto): void {
    // Load the selected content's data into the form
    this.contenuForm.patchValue({
      seanceId: contenu.seance?.idSeance, // Adjust if needed
      date: contenu.date,
      heure: contenu.heure,
      contenu: contenu.contenu
    });

    // Assign the content ID for editing
    this.editingContentId = contenu.idContenu !== undefined ? contenu.idContenu : null;
  }

  // Method to handle the submission of content
  onSubmit(): void {
    // Construct the ContenuDto object from the form values
    const contenuDto: ContenuDto = {
      idContenu: this.editingContentId !== null ? this.editingContentId : undefined, // Only include ID if we're editing
      date: this.contenuForm.value.date,
      heure: this.contenuForm.value.heure, // Ensure heure is of type LocalTime if necessary
      contenu: this.contenuForm.value.contenu,
      seance: { idSeance: this.contenuForm.value.seanceId } as SeanceDto // Assuming seance ID is sent, adjust as needed
    };

    if (this.editingContentId !== null) {
      // Update existing content
      this.contenuService.save(contenuDto).subscribe({
        next: () => {
          this.loadContentsForSeance(); // Reload contents after update
          this.contenuForm.reset(); // Reset form after submission
          this.editingContentId = null; // Reset editing ID
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du contenu', error);
        }
      });
    } else {
      // Add new content
      this.contenuService.save(contenuDto).subscribe({
        next: () => {
          this.loadContentsForSeance(); // Reload contents after addition
          this.contenuForm.reset(); // Reset form after submission
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout du contenu', error);
        }
      });
    }
  }

  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.contenuForm.patchValue({ richText: textarea.value });
  }

  onEditorContentChange(event: any): void {
    const html = event.html; // Get HTML content from the Quill editor
    this.contenuForm.patchValue({ contenu: html }); // Synchronize to the textarea's form control
  }


  // Method to edit a session
  public editSeance(idSeance: number): void {
    // Implement your edit logic here
    console.log('Editing session:', idSeance);
    this.selectedSeanceId = idSeance;
    // Load seance details into the form if necessary
  }

  // Method to delete a session
  public deleteSeance(idSeance: number): void {
    // Call the delete service method and handle response
    this.seanceService.delete(idSeance).subscribe({
      next: () => {
        console.log('Seance deleted successfully');
        // Remove the seance from the local array if necessary
        this.seances = this.seances.filter(seance => seance.idSeance !== idSeance);
      },
      error: (error) => {
        console.error('Error deleting session:', error);
      }
    });
  }
  




  // Réinitialiser le formulaire après ajout du contenu
  private resetForm(): void {
    this.contenuForm.reset();
  }

  loadContentsForSeance(): void {
    const selectedSeanceId = this.contenuForm.get('seanceId')?.value;
  
    if (selectedSeanceId) {
      // Assuming you have a method in your service to get contents by seance ID
      this.contenuService.findBySeanceId(selectedSeanceId).subscribe({
        next: (contents) => {
          this.contents = contents;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des contenus', error);
        }
      });
    } else {
      this.contents = []; // Reset contents if no session is selected
    }
  }
  
  deleteContent(idContenu: number): void {
    this.contenuService.deleteById(idContenu).subscribe({
      next: () => {
        this.contents = this.contents.filter(content => content.idContenu !== idContenu);
        console.log('Contenu supprimé avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du contenu', error);
      }
    });
  }
  
}
