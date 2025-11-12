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
  DevoirDto,
  EleveDevoirDto,
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
import { DevoirService } from '../services/devoir.service';
import { ClasseService } from '../services/classe.service';
import { UserProfileService } from '../services/user-profile-service.service';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';
import { SousclasseService } from '../services/sousclasse.service';
import { ClasseeleveService } from '../services/classeeleve.service';
import { EleveService } from '../services/eleve.service';
import { DevoirEleveService } from '../services/devoir-eleve.service';
import { PeriodeService } from '../services/periode.service';
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-classe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,  TranslateModule],
  templateUrl: './classe.component.html',
  styleUrl: './classe.component.css',
})
export class ClasseComponent implements OnInit {
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
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('selectPartitionModal') selectPartitionModal!: TemplateRef<any>;
  successMessage: string = '';
  classeForm: FormGroup;
  // Ajoutez ces deux propriétés
  selectedFile: File | null = null;
  selectedClasse: any = null; // Remplacez 'any' par le bon type pour votre classe si nécessaire
  classeImported: ClasseDto | null = null;
  sousClasses?: SousClasseDto[];
  periodes?: PeriodeDto[];
  devoirs?: DevoirDto[];
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private classeService: ClasseService,
    private niveauService: NiveauService,
    private sousclasseService: SousclasseService,
    private classeEleveService: ClasseeleveService,
    private eleveService: EleveService,
    private devoireleveService : DevoirEleveService,
    private periodeService: PeriodeService,
    private devoirService: DevoirService,
    private modalService: NgbModal, // Injecter NgbModal
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
    this.classeForm = this.fb.group({
      niveau: ['', Validators.required],
      libelle: ['', Validators.required],
      nbEleve: ['', [Validators.required, Validators.min(1)]],
      isGroupe: [false], // Field to indicate if the class is a group
      nbGroupe: [{ value: '', disabled: true }, [Validators.min(0)]], // Initially disabled
    });

    this.syncGroupeControl(this.classeForm);

    //   // Écouter les changements sur nbEleve
    // this.classeForm.get('nbEleve')?.valueChanges.subscribe(value => {
    //   this.updateSousClasses(value);
    // });
  }

  syncGroupeControl(niveauGroup: FormGroup): void {
    const isGroupeControl = niveauGroup.get('isGroupe');
    const nbGroupeControl = niveauGroup.get('nbGroupe');

    // Observer les changements de la case à cocher 'isGroupe'
    isGroupeControl?.valueChanges.subscribe((isChecked: boolean) => {
      if (isChecked) {
        nbGroupeControl?.enable(); // Activer le champ 'nbGroupe' si 'isGroupe' est coché
      } else {
        nbGroupeControl?.disable(); // Désactiver sinon
        nbGroupeControl?.setValue(''); // Remettre à vide si désactivé
      }
    });
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
    this.loadUserProfile();
    this.loadNiveaux();
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
              this.loadClassesByNiveau(firstNiveau.idNiveau);
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
  // Méthode pour charger les devoirs selon l'ID de la période
  loadClassesByNiveau(niveauId: number): void {
    if (niveauId) {
      this.classes$ = this.classeService.getClassesByNiveau(niveauId);
    } else {
      console.error('Période ID invalide.');
    }
  }

  onSubmit(): void {
    if (this.classeForm.valid) {
      const classeData: ClasseDto = {
        idClasse: this.currentClasse?.idClasse,
        libelle: this.classeForm.get('libelle')?.value,
        nombreEleve: this.classeForm.get('nbEleve')?.value,
        niveau: { idNiveau: this.classeForm.get('niveau')?.value }, // Associe l'objet niveau
      };

      if (this.isEditing && this.currentClasse) {
        // Mise à jour d'une classe existante
        this.classeService
          .createClasse(classeData)
          .subscribe((updatedClasse) => {
            this.loadClassesByNiveau(this.currentClasse?.niveau?.idNiveau!);

            // Si la classe est un groupe, on vérifie et crée les sous-classes
            if (this.classeForm.get('isGroupe')?.value) {
              this.createSousClasses(updatedClasse); // updatedClasse a maintenant un idClasse défini
            }

            this.showSuccessModal('Classe modifiée avec succès.');
            this.resetForm();
          });
      } else {
        // Ajout d'une nouvelle classe
        this.classeService
          .createClasse(classeData)
          .subscribe((createdClasse) => {
            this.loadClassesByNiveau(createdClasse.niveau?.idNiveau!);

            // Si la classe est un groupe, on vérifie et crée les sous-classes
            if (this.classeForm.get('isGroupe')?.value) {
              this.createSousClasses(createdClasse); // createdClasse a maintenant un idClasse défini
            }

            this.showSuccessModal('Classe ajoutée avec succès.');
            this.resetForm();
          });
      }
    }
  }

  private createSousClasses(createdClasse: ClasseDto): void {
    const nombreDeGroupes = this.classeForm.get('nbGroupe')?.value || 0;
    const totalEleves = createdClasse.nombreEleve || 0;

    if (nombreDeGroupes > 0 && totalEleves > 0) {
      const elevesParGroupe = Math.floor(totalEleves / nombreDeGroupes);
      const resteEleves = totalEleves % nombreDeGroupes;

      for (let i = 0; i < nombreDeGroupes; i++) {
        const sousClasseData: SousClasseDto = {
          libelle: `${createdClasse.libelle} G-${i + 1}`,
          nombreEleve:
            i === 0 ? elevesParGroupe + resteEleves : elevesParGroupe,
          classe: createdClasse,
        };
        console.log(createdClasse);
        this.sousclasseService.addSousClasse(sousClasseData).subscribe({
          next: (sousClasse) => {
            console.log('Sous-classe créée avec succès:', sousClasse);
          },
          error: (error) => {
            console.error(
              'Erreur lors de la création de la sous-classe:',
              error
            );
          },
        });
      }
    }
  }
  private updateSousClasses(updatedClasse: ClasseDto): void {
    const nombreDeGroupes = this.classeForm.get('nbGroupe')?.value || 0;
    const totalEleves = updatedClasse.nombreEleve || 0;

    if (nombreDeGroupes > 0 && totalEleves > 0) {
      const elevesParGroupe = Math.floor(totalEleves / nombreDeGroupes);
      const resteEleves = totalEleves % nombreDeGroupes;

      // Appel à un service pour récupérer les sous-classes existantes
      this.sousclasseService
        .getSousClassesByClasseId(updatedClasse.idClasse!)
        .subscribe((sousClasses) => {
          sousClasses.forEach((sousClasse, index) => {
            sousClasse.nombreEleve =
              index === 0 ? elevesParGroupe + resteEleves : elevesParGroupe;

            // Mise à jour de la sous-classe
            this.sousclasseService.addSousClasse(sousClasse).subscribe({
              next: (updatedSousClasse) => {
                console.log(
                  'Sous-classe mise à jour avec succès:',
                  updatedSousClasse
                );
              },
              error: (error) => {
                console.error(
                  'Erreur lors de la mise à jour de la sous-classe:',
                  error
                );
              },
            });
          });
        });
    }
  }
  // Ouvrir le modal de succès
  showSuccessModal(message: string): void {
    this.successMessage = message;
    this.modalService.open(this.successModal);
  }
  // Ouvrir la boîte de confirmation de suppression
  confirmDelete(classe: ClasseDto): void {
    this.currentClasse = classe;
    this.modalService.open(this.confirmDeleteModal);
  }

  // Supprimer une classe
  deleteClasse(): void {
    if (this.currentClasse) {
      this.classeService
        .deleteClasse(this.currentClasse.idClasse!)
        .subscribe(() => {
          this.loadClassesByNiveau(this.currentClasse?.niveau?.idNiveau!);
          this.resetForm();
        });
    }
  }

  // Réinitialiser le formulaire et l'état d'édition
  resetForm(): void {
    this.isEditing = false;
    this.currentClasse = null;
    this.classeForm.reset();
  }

  // Modifier une classe
  editClasse(classe: ClasseDto): void {
    this.isEditing = true;
    this.currentClasse = classe;
    this.classeForm.patchValue({
      niveau: classe.niveau?.idNiveau,
      libelle: classe.libelle,
      nbEleve: classe.nombreEleve,
    });

    // Fetch sous classes for the selected classe
    this.sousclasseService
      .getSousClassesByClasseId(classe.idClasse!)
      .subscribe({
        next: (sousClasses: SousClasseDto[]) => {
          if (sousClasses.length > 0) {
            this.classeForm.patchValue({
              isGroupe: true, // Set isGroupe to true if there are sous classes
              nbGroupe: sousClasses.length, // Set nbGroupe to the number of sous classes
            });
          } else {
            this.classeForm.patchValue({
              isGroupe: false, // Set isGroupe to false if no sous classes
              nbGroupe: null, // Reset nbGroupe if no sous classes
            });
          }
        },
        error: (error) => {
          console.error(
            'Erreur lors de la récupération des sous classes:',
            error
          );
        },
      });
  }

  onNiveauChange() {
    const selectedValue = this.classeForm.get('niveau')?.value;

    if (selectedValue === 'all') {
      // Charger tous les devoirs de toutes les périodes
      //this.loadAllDevoirs();
    } else {
      // Charger les devoirs pour la période sélectionnée
      this.loadClassesByNiveau(selectedValue);
    }
  }
  triggerFileInput(classe: ClasseDto): void {
    this.fileInput.nativeElement.click();
    console.log('trigger ----> ' + classe.libelle);
    this.classeImported = classe;
  }
  // Méthode d'importation du fichier Excel
  // Méthode d'importation du fichier Excel
  onFileChange(event: Event, classe: ClasseDto): void {
    classe = this.classeImported!;
    let numEleve = 1; // Par défaut, on commence par 1

    if (!classe) {
        console.error('Classe non spécifiée.');
        return;
    }

    console.log('Nom de la classe actuelle :', classe.libelle);

    const target = event.target as HTMLInputElement;
    const file: File | null = (target.files && target.files[0]) || null;

    if (file) {
        const reader = new FileReader();

        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Vérification de la cellule pour le libellé de la classe
            let cellAddress: string;
            let startRow: number;
            let codeCol: number;
            let firstNameCol: number;
            let lastNameCol: number;
            let dateCol: number;
            let genderCol: number;
            let shouldConvertDate: boolean;

            // Configuration en fonction de la structure de fichier
            if (worksheet['I9']?.v === classe.libelle) {
                // Premier fichier : I9 -> conversion nécessaire
                cellAddress = 'I9';
                startRow = 17; // Ligne à partir de laquelle on commence à lire
                codeCol = 2;   // Colonne C pour le code
                firstNameCol = 3; // Colonne D pour le prénom (concaténé avec le nom dans le premier fichier)
                lastNameCol = 3;  // Colonne D pour le nom (même colonne)
                dateCol = 5;      // Colonne F pour la date de naissance
                genderCol = 4;    // Colonne E pour le genre
                shouldConvertDate = true; // Conversion nécessaire pour ce type de fichier
            } else if (worksheet['C8']?.v === classe.libelle) {
                // Deuxième fichier : C8 -> pas de conversion
                cellAddress = 'C8';
                startRow = 10; // Ligne à partir de laquelle on commence à lire
                codeCol = 1;   // Colonne B pour le code
                firstNameCol = 2; // Colonne C pour le prénom
                lastNameCol = 3;  // Colonne D pour le nom
                dateCol = 5;      // Colonne F pour la date de naissance
                genderCol = 4;    // Colonne E pour le genre
                shouldConvertDate = false; // Pas de conversion de date pour ce fichier
            } else {
                console.error(`La cellule C8 ou I9 ne correspond pas au libellé de la classe sélectionnée. Importation annulée.`);
                alert(`Aucune cellule correspondante trouvée pour la classe sélectionnée. Importation annulée.`);
                return;
            }

            console.log(`Valeur de la cellule ${cellAddress} :`, worksheet[cellAddress]?.v);

            console.log('Importation des élèves en cours.');
            const jsonData: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const eleves: EleveDto[] = [];

            // Commencez à lire les élèves à partir de la ligne spécifiée
            for (let i = startRow; i < jsonData.length; i++) {
                const row = jsonData[i];

                // Vérifiez si les colonnes importantes existent
                if (row[codeCol] && row[firstNameCol] && row[dateCol] && row[genderCol]) {
                    // Concaténer prénom et nom pour le deuxième fichier
                    const fullName = worksheet['C8']?.v === classe.libelle
                        ? `${row[firstNameCol]} ${row[lastNameCol]}` // Concaténation pour le deuxième fichier (cellule C8)
                        : row[firstNameCol]; // Nom seul pour le premier fichier (cellule I9)

                    // Déterminer le genre à partir de la colonne correspondante
                    const gender: EleveDto.GenderEnum = row[genderCol] === 'أنثى' ? EleveDto.GenderEnum.Female : EleveDto.GenderEnum.Male;

                    // Conversion de la date si nécessaire
                    const dateNaissance = shouldConvertDate
                        ? this.convertDateToYYYYMMDD(row[dateCol]) // Conversion pour le premier fichier
                        : row[dateCol]; // Laisser la date d'origine pour le deuxième fichier

                    // Construction de l'objet élève
                    const eleve: EleveDto = {
                        num: numEleve++,                    // Numéro d'élève
                        code: row[codeCol] as string,      // Code
                        nom: fullName,                      // Nom complet ou seul
                        dateNaissance: dateNaissance,       // Date de naissance
                        gender: gender                      // Genre
                    };
                    console.log('Élève importé :', eleve); // Log pour vérifier l'objet élève
                    eleves.push(eleve);
                }
            }

            alert(`Nombre d'élèves importés (${eleves.length}) dans la classe (${classe.libelle}). Importation réussie.`);
            console.log('Liste des élèves:', eleves);

            // Enregistrer les élèves et créer les associations
            this.enregistrerEleves(eleves, classe);
            this.updateNombreEleve(classe, eleves.length);
        };

        reader.readAsArrayBuffer(file);
    }
}



  // Méthode pour enregistrer les élèves en utilisant le service EleveService
  // Enregistrer les élèves et vérifier les sous-classes
  enregistrerEleves(eleves: EleveDto[], classe: ClasseDto): void {
    this.eleves = eleves; // Optionnel, si vous avez besoin de la liste quelque part
    
    // Enregistrer chaque élève
    const registrationCalls = eleves.map((eleve) => {
      return this.eleveService.create(eleve).pipe(
        catchError((error) => {
          console.error(
            `Erreur lors de l'enregistrement de l'élève ${eleve.nom}.`,
            error
          );
          return of(null); // Ignore l'erreur pour continuer
        })
      );
    });

    // Exécutez toutes les demandes d'enregistrement simultanément
    forkJoin(registrationCalls).subscribe((responses) => {
      // Filtrer les réponses non nulles pour obtenir les élèves enregistrés
      const successfulRegistrations = responses.filter(
        (response): response is EleveDto => response !== null // Assertion de type ici
      );

      // Appeler la méthode gestionClasseEleve pour associer les élèves à la classe
      this.gestionClasseEleve(successfulRegistrations, classe);

      // Ensuite, enregistrer les devoirs pour chaque élève enregistré
      successfulRegistrations.forEach((eleve) => {
        this.enregistrerDevoireEleve(eleve);
      });
    });
}



  private updateNombreEleve(classe: ClasseDto, nombreAjoutes: number): void {
    if (classe.nombreEleve !== undefined) {
      classe.nombreEleve = nombreAjoutes; // Met à jour le nombre total d'élèves
    } else {
      classe.nombreEleve = nombreAjoutes; // Si pas de valeur précédente, initialise
    }

    // Appel au service pour mettre à jour la classe dans la base de données
    this.classeService.createClasse(classe).subscribe(
      (response) => {
        console.log("Nombre d'élèves mis à jour avec succès :", response);
      },
      (error) => {
        console.error(
          "Erreur lors de la mise à jour du nombre d'élèves :",
          error
        );
      }
    );
  }

  // Méthode pour convertir une date de "DD-MM-YYYY" à "YYYY-MM-DD"
  convertDateToYYYYMMDD(dateStr: string): string {
    // Supposons que la date est dans le format "DD-MM-YYYY"
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  // Afficher les choix de sous-classe et enregistrer en fonction du choix
  eleves: EleveDto[] = [];
  afficherChoixSousClasse(
    classe: ClasseDto,
    eleves: EleveDto[],
    sousClasses: SousClasseDto[]
  ): void {
    const modalRef: NgbModalRef = this.modalService.open(
      this.selectPartitionModal
    );

    modalRef.result
      .then((result) => {
        // Appliquer la répartition en fonction du choix
        eleves.forEach((eleve) => {
          if (result === 'pair-impair') {
            this.repartirElevesPairImpair(eleve, classe, sousClasses);
          } else if (result === 'moitie') {
            this.repartirElevesParMoitie(eleve, classe, sousClasses);
          } else {
            this.enregistrerClasseEleve(eleve, classe, null);
          }
        });
      })
      .catch((error) => {
        console.log('Modal dismissed', error);
      });
  }

  gestionClasseEleve(eleves: EleveDto[], classe: ClasseDto): void {
    this.sousclasseService
      .getSousClassesByClasseId(classe.idClasse!)
      .subscribe({
        next: (sousClasses) => {
          if (sousClasses && sousClasses.length > 0) {
            this.sousClasses = sousClasses;
            // Ouvrir le modal une seule fois pour tous les élèves
            this.afficherChoixSousClasse(classe, eleves, sousClasses);
          } else {
            // Enregistrer l'association sans sous-classe
            eleves.forEach((eleve) =>
              this.enregistrerClasseEleve(eleve, classe, null),
            
            
            
            );
          }
        },
        error: (error) => {
          console.error(
            `Erreur lors de la récupération des sous-classes pour la classe ${classe.libelle}.`,
            error
          );
        },
      });
  }

  // Méthode pour gérer l'enregistrement en fonction de la parité (pair/impair)
  repartirElevesPairImpair(
    eleve: EleveDto,
    classe: ClasseDto,
    sousClasses: SousClasseDto[]
  ): void {
    const sousClassePair = sousClasses[0];
    const sousClasseImpair = sousClasses[1];
    if (eleve.num! % 2 === 0) {
      this.enregistrerClasseEleve(eleve, classe, sousClassePair);
    } else {
      this.enregistrerClasseEleve(eleve, classe, sousClasseImpair);
    }
  }

  // Méthode pour gérer l'enregistrement en fonction de la moitié (première ou deuxième moitié)
  repartirElevesParMoitie(
    eleve: EleveDto,
    classe: ClasseDto,
    sousClasses: SousClasseDto[]
  ): void {
    const totalEleves = classe.nombreEleve!; // Remplacez cela par le nombre réel d'élèves
    const midpoint = totalEleves / 2;
    const sousClasse1 = sousClasses[0];
    const sousClasse2 = sousClasses[1];

    if (eleve.num! <= midpoint) {
      this.enregistrerClasseEleve(eleve, classe, sousClasse1);
    } else {
      this.enregistrerClasseEleve(eleve, classe, sousClasse2);
    }
  }

  // Méthode pour enregistrer l'association élève-classe-sous-classe
  enregistrerClasseEleve(
    eleve: EleveDto,
    classe: ClasseDto,
    sousClasse: SousClasseDto | null
  ): void {
    const classeEleve: ClasseEleveDto = {
      eleve: eleve,
      classe: classe,
      sousClasse: sousClasse,
    };

    this.classeEleveService.create(classeEleve).subscribe({
      next: (response) => {
        console.log('Classe-Eleve enregistré avec succès.', response);
      },
      error: (error) => {
        console.error(
          'Erreur lors de l’enregistrement de la Classe-Eleve.',
          error
        );
      },
    });
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

  loadDevoirsByPeriode(periodeId: number): void {
    this.devoirService.getDevoirsByPeriodeId(periodeId).subscribe({
      next: (devoirs) => {
        this.devoirs = devoirs;
      },
      error: (err) => console.error('Erreur lors du chargement des devoirs', err),
    });
  }

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
