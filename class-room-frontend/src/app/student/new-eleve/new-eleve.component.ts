import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClasseeleveService } from '../../services/classeeleve.service';
import { EleveService } from '../../services/eleve.service';
import { UserProfileService } from '../../services/user-profile-service.service';
import { ClasseService } from '../../services/classe.service';
import {
  AnneeScolaireDto,
  ClasseEleveDto,
  EleveDevoirDto,
  EleveDto,
  EtablissementDto,
  EtablissementProfesseurDto,
  NiveauDto,
  NiveauService,
  ProfesseurDto,
} from '../../api';
import { SousclasseService } from '../../services/sousclasse.service';
import { BehaviorSubject } from 'rxjs';
import { PeriodeDto } from '../../../../path/to/generated-client';
import { DevoirService } from '../../services/devoir.service';
import { DevoirEleveService } from '../../services/devoir-eleve.service';
import { PeriodeService } from '../../services/periode.service';
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-new-eleve',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './new-eleve.component.html',
  styleUrl: './new-eleve.component.css',
})
export class NewEleveComponent implements OnInit {
  eleveForm: FormGroup;
  professeur: ProfesseurDto | null = null;
  anneeScolaire: AnneeScolaireDto | null = null;
  etablissement: EtablissementDto | null = null;
  etablissementProfesseur: EtablissementProfesseurDto | null = null;
  public niveaux$ = new BehaviorSubject<NiveauDto[]>([]);
  niveauId!: number;
  classes: any[] = [];
  sousClasses: any[] = [];
  photoUrl: string | ArrayBuffer | null = null;
  defaultAvatarUrl: string = 'assets/images/user.png'; // Chemin vers votre image par défaut
  imageUrl?: string = 'assets/images/user.png'; // Chemin vers l'avatar par défaut
  selectedClasseId: number | null = null;
  selectedSousClasseId: number | null = null;
  classeEleves: ClasseEleveDto[] = [];
  hasSousClasses: boolean = false;
  @ViewChild('successModal') successModal!: ElementRef;
  currentLang: string = 'fr'; // Langue par défaut
  selectedPhoto?: File;
  constructor(
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private eleveService: EleveService,
    private devoirService: DevoirService,
    private devoireleveService: DevoirEleveService,
    private periodeService: PeriodeService,
    private fb: FormBuilder,
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    // Initialisation du formulaire
    this.eleveForm = this.fb.group({
      niveau: ['', Validators.required],
      classe: ['', Validators.required],
      sousClasse: [''],
      code: ['', Validators.required],
      num: [null, Validators.required],
      nom: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      gender: ['', Validators.required],
      photo: [''],
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
          //const currentPeriode = this.getCurrentPeriode();
          // if (currentPeriode) {
          //   this.formGroup.get('periode')?.setValue(currentPeriode.idPeriode);
          // }
        },
        (error) => {
          console.error('Erreur lors du chargement des périodes', error);
        }
      );
  }
  // Méthode pour gérer le changement de niveau et charger les classes associées
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

  // Méthode pour gérer le changement de classe et charger les sous-classes associées
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
  }

  onSousClasseChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const sousClasseId = target.value ? parseInt(target.value) : null;
    this.selectedSousClasseId = sousClasseId;
    console.log('Sous-classe sélectionnée:', this.selectedSousClasseId);
  }

  loadClasseEleves(): void {
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
              this.classeEleves = data;
              if (this.classeEleves.length === 0) {
                console.warn(
                  'Aucune association trouvée pour la classe et sous-classe sélectionnées.'
                );
              }
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
            this.classeEleves = data;
            if (this.classeEleves.length === 0) {
              console.warn(
                'Aucune association trouvée pour la classe sélectionnée.'
              );
            }
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

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
      this.selectedPhoto = file; // Store the selected photo
      const reader = new FileReader();
      reader.onload = () => {
        this.photoUrl = reader.result; // Preview the image
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    // Réinitialiser l'aperçu à l'avatar par défaut
    this.photoUrl = this.defaultAvatarUrl;

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

  // Méthode pour soumettre le formulaire
  // onSubmit(): void {
  //   if (this.eleveForm.valid) {
  //     const eleveData: EleveDto = this.eleveForm.value;
  //     this.eleveService.create(eleveData).subscribe(
  //       (response) => {
  //         console.log('Élève créé avec succès', response);
  //         // Réinitialiser le formulaire ou rediriger l'utilisateur
  //       },
  //       (error) => {
  //         console.error("Erreur lors de la création de l'élève", error);
  //       }
  //     );
  //   }
  // }

  loadImage(url: string): void {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.photoUrl = url; // Si l'image se charge correctement
    };
    img.onerror = () => {
      this.photoUrl = this.defaultAvatarUrl; // Si l'image échoue à charger, rétablir l'avatar par défaut
    };
  }

  onSubmit(): void {
    if (this.eleveForm.valid) {
      const eleveData: EleveDto = {
        code: this.eleveForm.value.code,
        num: this.eleveForm.value.num,
        nom: this.eleveForm.value.nom,
        dateNaissance: this.eleveForm.value.dateNaissance,
        gender: this.eleveForm.value.gender,
        // Ajoutez d'autres propriétés pertinentes si nécessaire
      };

      // Crée l'élève
      this.eleveService.create(eleveData).subscribe(
        (response) => {
          console.log('Élève créé avec succès', response);
          this.enregistrerDevoireEleve(response)
          // Vérifier si une photo est sélectionnée et la télécharger si nécessaire
          if (this.selectedPhoto) {
            this.uploadPhoto(response.idEleve!);
          } else {
            console.log('Aucune photo sélectionnée');
          }

          // Récupérer la classe sélectionnée via ClasseService
          if (this.selectedClasseId) {
            this.classeService.getClasseById(this.selectedClasseId).subscribe(
              (classeResponse) => {
                console.log('Classe récupérée', classeResponse);
                // Récupérer la sous-classe si elle est sélectionnée
                if (this.selectedSousClasseId) {
                  console.log(this.selectedSousClasseId);
                  this.sousclasseService
                    .getSousClasseById(this.selectedSousClasseId)
                    .subscribe(
                      (sousClasseResponse) => {
                        console.log(
                          'Sous-classe récupérée',
                          sousClasseResponse
                        );

                        const classeEleveData: ClasseEleveDto = {
                          eleve: response,
                          classe: classeResponse,
                          sousClasse: sousClasseResponse,
                        };
                        console.log(classeEleveData);
                        this.classeEleveService
                          .create(classeEleveData)
                          .subscribe(
                            (classeEleveResponse) => {
                              console.log(
                                'ClasseEleve association créée avec succès',
                                classeEleveResponse
                              );
                              const modalElement =
                                this.successModal.nativeElement;
                              const modal = new(window as any).bootstrap.Modal(modalElement); // Use Bootstrap's modal class
                              modal.show(); // Show modal
                              this.eleveForm.reset(); // Reset the form
                              this.removePhoto(); // Optionally remove photo
                            },
                            (error) => {
                              console.error(
                                "Erreur lors de la création de l'association ClasseEleve",
                                error
                              );
                            }
                          );
                      },
                      (error) => {
                        console.error(
                          'Erreur lors de la récupération de la sous-classe',
                          error
                        );
                      }
                    );
                } else {
                  // Créer l'association sans sous-classe
                  const classeEleveData: ClasseEleveDto = {
                    eleve: { idEleve: response.idEleve },
                    classe: { idClasse: classeResponse.idClasse },
                    sousClasse: null,
                  };

                  this.classeEleveService.create(classeEleveData).subscribe(
                    (classeEleveResponse) => {
                      console.log(
                        'ClasseEleve association créée avec succès',
                        classeEleveResponse
                      );
                      const modalElement =
                                this.successModal.nativeElement;
                              const modal = new(window as any).bootstrap.Modal(modalElement); // Use Bootstrap's modal class
                              modal.show(); // Show modal
                              this.eleveForm.reset(); // Reset the form
                              this.removePhoto(); // Optionally remove photo
                      // Actions supplémentaires après la création
                    },
                    (error) => {
                      console.error(
                        "Erreur lors de la création de l'association ClasseEleve",
                        error
                      );
                    }
                  );
                }
              },
              (error) => {
                console.error(
                  'Erreur lors de la récupération de la classe',
                  error
                );
              }
            );
          } else {
            console.warn('Aucune classe sélectionnée');
          }
        },
        (error) => {
          console.error("Erreur lors de la création de l'élève", error);
        }
      );
    } else {
      console.warn("Le formulaire n'est pas valide");
    }
  }

  uploadPhoto(eleveId: number): void {
    if (this.selectedPhoto) {
      this.eleveService.updatePhoto(eleveId, this.selectedPhoto).subscribe(
        (photoData) => {
          console.log('Photo mise à jour avec succès', photoData);
          // Optionally, perform additional actions after successful photo upload
        },
        (error) => {
          console.error('Erreur lors de la mise à jour de la photo', error);
        }
      );
    }
  }
  periodes?: PeriodeDto[];


  enregistrerDevoireEleve(eleve: EleveDto): void {
    // D'abord, nous devons nous assurer que les périodes et les devoirs sont chargés.
    if (!this.periodes || this.periodes.length === 0) {
      console.error('Aucune période n\'a été chargée.');
      return;
    }
  
    // Boucle sur toutes les périodes
    this.periodes.forEach((periode) => {
      // Charger les devoirs pour la période donnée
      this.devoirService.getDevoirsByPeriodeId(periode.idPeriode!).subscribe({
        next: (devoirs) => {
          // Boucle sur tous les devoirs de cette période
          devoirs.forEach((devoir) => {
            const devoirEleve: EleveDevoirDto = {
              eleve: eleve,
              devoir: devoir,
              datePassage: '', // Vous pouvez ajuster cela si nécessaire
              heurePassage: undefined, // Ajustez cela si nécessaire
            };
  
            // Enregistrer le devoir pour cet élève
            this.devoireleveService.create(devoirEleve).subscribe({
              next: (response) => {
                console.log(
                  `Devoir-Eleve pour l'élève ${eleve.nom} et le devoir ${devoir.libelle} enregistré avec succès.`,
                  response
                );
              },
              error: (error) => {
                console.error(
                  `Erreur lors de l'enregistrement du devoir ${devoir.libelle} pour l'élève ${eleve.nom}.`,
                  error
                );
              },
            });
          });
        },
        error: (err) => {
          console.error(
            `Erreur lors du chargement des devoirs pour la période ${periode.libelle}.`,
            err
          );
        },
      });
    });
  }
}
