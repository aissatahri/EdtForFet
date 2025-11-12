import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClasseDto, ClasseEleveDto, EleveDto } from '../api';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClasseeleveService } from '../services/classeeleve.service';
import { EleveService } from '../services/eleve.service';
import { environment } from '../../environments/environment';
import { NoteStudentComponent } from '../mark/note-student/note-student.component';
import { AbsenceStudentComponent } from '../absence/absence-student/absence-student.component';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-student',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NoteStudentComponent,
    AbsenceStudentComponent,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css'],
})
export class StudentComponent implements OnInit {
  eleveForm: FormGroup;
  student?: EleveDto;
  id: number | undefined;
  selectedPhoto?: File;
  defaultAvatarUrl: string = 'assets/images/user.png'; // Chemin vers votre image par défaut
  imageUrl?: string = 'assets/images/user.png'; // Chemin vers l'avatar par défaut
  // imageUrl: string | undefined = this.defaultAvatarUrl; // Initialiser avec l'avatar par défaut
  baseUrl = `${environment.apiUrl}/eleves`;
  genderEnum = EleveDto.GenderEnum;
  classeEleve?: ClasseEleveDto; // Nouvelle propriété pour stocker la classe de l'élève
  classeSelect?: ClasseDto;
  openPanelIds: string[] = ['panelContent5', 'panelContent6', 'panelContent7']; // Initialize with all panel IDs
  studentsList: EleveDto[] = []; // To store the list of students in the class
  currentIndex: number = 0; // To track the current student's index
  currentLang: string = 'fr'; // Langue par défaut

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private studentService: ClasseeleveService,
    private eleveService: EleveService,
    private classeEleveService: ClasseeleveService,
    private router: Router,
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    this.eleveForm = this.fb.group({
      idEleve: [null],
      code: ['', Validators.required],
      num: [null, Validators.required],
      nom: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      gender: ['', Validators.required],
      photo: [null], // Ici, le contrôle pour la photo est initialisé
      classe: [''], // Champ ajouté pour la classe
      sousClasse: [''], // Champ ajouté pour la sous-classe
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string; // Mettre à jour imageUrl pour l'aperçu
      };
      reader.readAsDataURL(file);

      // Mettez à jour le FormControl avec le fichier sélectionné
      this.eleveForm.get('photo')?.setValue(this.selectedPhoto);

      // Marquez le champ comme "dirty" et mettez à jour la validité
      this.eleveForm.get('photo')?.markAsDirty();
      this.eleveForm.markAsDirty();
      this.eleveForm.updateValueAndValidity();
    }
  }

  // Ensure that the form's validity is checked in the ngOnInit and reset
  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    // Load the student and the associated class list
    if (this.id) {
      this.getStudent(this.id); // Get the current student details
    }

    // Ensure students list is loaded when class is loaded
    this.eleveForm.get('photo')?.valueChanges.subscribe(() => {
      this.eleveForm.updateValueAndValidity();
    });
    
  }

  

  onSubmit(): void {
    if (this.eleveForm.valid) {
      const updatedEleve: EleveDto = {
        idEleve: this.student ? this.student.idEleve : 0,
        code: this.eleveForm.value.code,
        num: this.eleveForm.value.num,
        nom: this.eleveForm.value.nom,
        dateNaissance: this.eleveForm.value.dateNaissance,
        gender: this.eleveForm.value.gender,
      };

      if (this.student && typeof this.student.idEleve === 'number') {
        this.eleveService.create(updatedEleve).subscribe(
          (data) => {
            console.log('Élève mis à jour avec succès', data);

            if (this.selectedPhoto) {
              this.eleveService
                .updatePhoto(this.student?.idEleve!, this.selectedPhoto)
                .subscribe(
                  (photoData) => {
                    console.log('Photo mise à jour avec succès', photoData);

                    // Appel à findByCode pour récupérer l'élève à partir du code
                    this.eleveService
                      .findByCode(this.eleveForm.value.code)
                      .subscribe(
                        (eleve) => {
                          console.log('Élève récupéré avec findByCode:', eleve);
                          // Redirection avec l'idEleve de l'élève trouvé
                          this.router.navigate(['/dash/lstEleve'], {
                            queryParams: {
                              idEleve: eleve.idEleve,
                            },
                          });
                        },
                        (error) => {
                          console.error(
                            "Erreur lors de la récupération de l'élève par code",
                            error
                          );
                        }
                      );
                  },
                  (error) => {
                    console.error(
                      'Erreur lors de la mise à jour de la photo',
                      error
                    );
                  }
                );
            } else {
              // Si aucune photo n'est sélectionnée, faire la redirection après avoir récupéré l'idEleve
              this.eleveService.findByCode(this.eleveForm.value.code).subscribe(
                (eleve) => {
                  console.log('Élève récupéré avec findByCode:', eleve);
                  // this.router.navigate(['/dash/lstEleve'], {
                  //   queryParams: {
                  //     idEleve: eleve.idEleve
                  //   }
                  // });
                },
                (error) => {
                  console.error(
                    "Erreur lors de la récupération de l'élève par code",
                    error
                  );
                }
              );
            }
          },
          (error) => {
            console.error("Erreur lors de la mise à jour de l'élève", error);
          }
        );
      } else {
        console.warn('Aucun élève à mettre à jour ou idEleve est indéfini');
      }
    } else {
      console.warn("Le formulaire n'est pas valide");
    }
  }

  resetForm(): void {
    this.eleveForm.reset(); // Réinitialiser le formulaire
    this.selectedPhoto = undefined; // Réinitialiser la sélection de photo
    this.imageUrl = undefined; // Réinitialiser l'aperçu d'image

    // Réinitialiser manuellement le champ d'image dans le DOM
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Vider le champ de fichier
    }
  }

  updateFormWithStudentData(): void {
    if (this.student) {
      this.eleveForm.patchValue({
        code: this.student.code,
        num: this.student.num,
        nom: this.student.nom,
        dateNaissance: this.student.dateNaissance,
        gender: this.student.gender,
      });

      // Load student photo or default avatar
      const photoUrl = `http://localhost:8080/classroom/v1/eleves/${this.student.idEleve}/photo`;
      this.loadImage(photoUrl);
    } else {
      // Reset to default avatar if no student found
      this.imageUrl = this.defaultAvatarUrl;
    }
  }

  loadImage(url: string): void {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.imageUrl = url; // Si l'image se charge correctement
    };
    img.onerror = () => {
      this.imageUrl = this.defaultAvatarUrl; // Si l'image échoue à charger, rétablir l'avatar par défaut
    };
  }

  getStudent(id: number): void {
    this.classeEleveService.findById(id).subscribe(
      (data) => {
        this.student = data.eleve;
        this.updateFormWithStudentData();
        this.eleveForm.patchValue({
          classe: data.classe?.libelle,
          sousClasse: data.sousClasse?.libelle,
        });

        // Ensure studentsList is loaded before navigating
        if (this.studentsList.length === 0) {
          this.loadClasseForStudent(this.student?.idEleve!); // Load students list if not done already
        } else {
          // If studentsList is already loaded, find the current student index
          this.currentIndex = this.studentsList.findIndex(
            (eleve) => eleve.idEleve === this.student?.idEleve
          );
        }
      },
      (error) => {
        console.error(
          "Erreur lors du chargement des données de l'élève",
          error
        );
      }
    );
  }

  // Load the class and its students
  loadClasseForStudent(eleveId: number): void {
    this.classeEleveService.findByEleveId(eleveId).subscribe(
      (classeEleveList) => {
        if (classeEleveList && classeEleveList.length > 0) {
          this.classeSelect = classeEleveList[0].classe;
          this.classeEleve = classeEleveList[0];

          // Load the students in the class
          this.loadStudentsByClasse(this.classeSelect?.idClasse!);
        }
      },
      (error) => {
        console.error('Error loading class', error);
      }
    );
  }
  // Load all students in the same class
  loadStudentsByClasse(classeId: number): void {
    this.classeEleveService.findByClasseId(classeId).subscribe(
      (classeEleveList) => {
        // Extract the `EleveDto` from each `ClasseEleveDto`, filter undefined, and sort by `num`
        this.studentsList = classeEleveList
          .map((classeEleve) => classeEleve.eleve) // Get `EleveDto` from `ClasseEleveDto`
          .filter((eleve): eleve is EleveDto => eleve !== undefined) // Filter out undefined values
          .sort((a, b) => a?.num! - b?.num!); // Sort students by their number

        // Find the index of the current student in the sorted list
        this.currentIndex = this.studentsList.findIndex(
          (eleve) => eleve.idEleve === this.student?.idEleve
        );
      },
      (error) => {
        console.error('Error loading students by class', error);
      }
    );
  }
  removeImage(): void {
    // Réinitialiser l'aperçu à l'avatar par défaut
    this.imageUrl = this.defaultAvatarUrl;

    // Réinitialiser la photo sélectionnée à null
    this.selectedPhoto = undefined;

    // Mettre à jour le formulaire pour refléter l'absence de photo
    this.eleveForm.get('photo')?.setValue(null);

    // Marquer le champ comme modifié (dirty) et mettre à jour la validité du formulaire
    this.eleveForm.get('photo')?.markAsDirty();
    this.eleveForm.updateValueAndValidity();

    // Réinitialiser manuellement le champ d'image dans le DOM
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Vider le champ de fichier
    }
  }

  togglePanel(panelId: string): void {
    // Check if the panel is already open
    const index = this.openPanelIds.indexOf(panelId);

    if (index > -1) {
      // Panel is open, remove it from the openPanelIds
      this.openPanelIds.splice(index, 1);
    } else {
      // Panel is closed, add it to the openPanelIds
      this.openPanelIds.push(panelId);
    }
  }

  isPanelOpen(panelId: string): boolean {
    return this.openPanelIds.includes(panelId);
  }

  isNavigating = false; // Add this property to track navigation
  nextStudent(): void {
    if (this.isNavigating) return; // Empêche la navigation si elle est déjà en cours
    this.isNavigating = true;

    // Vérifiez si on peut aller au prochain étudiant
    if (this.currentIndex < this.studentsList.length - 1) {
      const nextIndex = this.currentIndex + 1;
      this.currentIndex = nextIndex;

      // Mettez à jour l'étudiant et le formulaire avec les données préchargées
      this.student = this.studentsList[this.currentIndex];
      this.updateFormWithStudentData(); // Mettre à jour le formulaire avec les infos de l'élève

      // Reset navigation state
      this.isNavigating = false;
    }
  }

  previousStudent(): void {
    if (this.isNavigating) return; // Empêche la navigation si elle est déjà en cours
    this.isNavigating = true;

    // Vérifiez si on peut aller à l’étudiant précédent
    if (this.currentIndex > 0) {
      const prevIndex = this.currentIndex - 1;
      this.currentIndex = prevIndex;

      // Mettez à jour l'étudiant et le formulaire avec les données préchargées
      this.student = this.studentsList[this.currentIndex];
      this.updateFormWithStudentData(); // Mettre à jour le formulaire avec les infos de l'élève

      // Reset navigation state
      this.isNavigating = false;
    }
  }
}
