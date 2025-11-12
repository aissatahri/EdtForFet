import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnneeScolaireService } from '../../services/annee-scolaire.service';
import { AnneeScolaireDto } from '../../api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-annee-scolaire-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './annee-scolaire-create.component.html',
  styleUrl: './annee-scolaire-create.component.css',
})
export class AnneeScolaireCreateComponent implements OnInit {
  academicYearForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private academicYearService: AnneeScolaireService
  ) {}

  ngOnInit(): void {
    // Initialisation du formulaire avec validation
    this.academicYearForm = this.formBuilder.group({
      libelle: new FormControl({ value: '', disabled: true }, Validators.required), // Utilisation correcte de disabled
      dateDebut: ['', Validators.required],
      dateFin: ['', [Validators.required, this.dateFinValidator.bind(this)]], // Custom validator pour la date de fin
    });

    // Mise à jour automatique du libellé lorsque les dates changent
    this.academicYearForm.get('dateDebut')?.valueChanges.subscribe(() => {
      this.updateLibelle();
    });
    this.academicYearForm.get('dateFin')?.valueChanges.subscribe(() => {
      this.updateLibelle();
    });
  }

  // Méthode pour générer le libellé à partir des années des dates
  private updateLibelle(): void {
    const dateDebut = this.academicYearForm.get('dateDebut')?.value;
    const dateFin = this.academicYearForm.get('dateFin')?.value;

    if (dateDebut && dateFin) {
      const debutYear = new Date(dateDebut).getFullYear();
      const finYear = new Date(dateFin).getFullYear();
      // Générer le libellé sous la forme "2024-2025"
      const libelle = `${debutYear}-${finYear}`;
      this.academicYearForm.get('libelle')?.setValue(libelle);
    }
  }

  // Custom validator pour vérifier que la date de fin est supérieure à la date de début
  private dateFinValidator(control: any) {
    const dateDebut = this.academicYearForm?.get('dateDebut')?.value;
    const dateFin = control.value;

    if (dateDebut && dateFin) {
      if (new Date(dateFin) <= new Date(dateDebut)) {
        return { dateFinInvalid: true }; // Retourne une erreur si la date de fin est inférieure ou égale à la date de début
      }
    }
    return null; // Retourne null si tout est correct
  }

  createAcademicYear(): void {
    if (this.academicYearForm.valid) {
      // Préparation des données pour la création de l'année scolaire
      const newAcademicYear: AnneeScolaireDto = {
        libelle: this.academicYearForm.get('libelle')?.value, // Récupérer directement la valeur de libelle
        dateDebut: this.academicYearForm.value.dateDebut,
        dateFin: this.academicYearForm.value.dateFin,
      };

      console.log('Année scolaire à soumettre :', newAcademicYear);

      // Appel du service pour ajouter l'année scolaire
      this.addAnneeScolaire(newAcademicYear);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.academicYearForm.markAllAsTouched();
    }
  }

  // Méthode pour envoyer les données au service d'ajout d'année scolaire
  private addAnneeScolaire(newAnneeScolaire: AnneeScolaireDto): void {
    this.academicYearService.create(newAnneeScolaire).subscribe(
      (response) => {
        console.log('Année scolaire créée avec succès :', response);
        this.academicYearForm.reset(); // Réinitialiser le formulaire après succès

        // Afficher le modal de succès
        const modalElement = document.getElementById('successModalAnnee');
        if (modalElement) {
          const successModal = new(window as any).bootstrap.Modal(modalElement);
          successModal.show();
        } else {
          console.error('Le modal successModalAnnee n\'a pas été trouvé');
        }
      },
      (error) => {
        console.error('Erreur lors de la création de l\'année scolaire :', error);
      }
    );
  }
}
