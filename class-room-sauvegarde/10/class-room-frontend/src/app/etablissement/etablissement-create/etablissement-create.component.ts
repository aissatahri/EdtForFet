import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EtablissementService } from '../../services/etablissement.service';
import { EtablissementDto } from '../../api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-etablissement-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './etablissement-create.component.html',
  styleUrl: './etablissement-create.component.css'
})
export class EtablissementCreateComponent implements OnInit {
  establishmentForm!: FormGroup;

  constructor(private fb: FormBuilder, private establishmentService: EtablissementService) {}

  ngOnInit(): void {
    // Création du formulaire avec validation
    this.establishmentForm = this.fb.group({
      libelle: ['', Validators.required], // Libellé requis
      telephone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // Téléphone requis (10 chiffres)
      adresse: ['', Validators.required] // Adresse requise
    });
  }

  // Méthode de création d'un établissement
  createEstablishment(): void {
    if (this.establishmentForm.valid) {
      const newEtablissement: EtablissementDto = this.establishmentForm.value;

      this.establishmentService.createEtablissement(newEtablissement).subscribe(
        (response) => {
          console.log('Établissement créé avec succès:', response);
          this.establishmentForm.reset(); // Réinitialiser le formulaire après succès

          // Afficher le modal de succès après création
          const successModal = new (window as any).bootstrap.Modal(
            document.getElementById('successModalEtab')
          );
          successModal.show();
        },
        (error) => {
          console.error('Erreur lors de la création de l\'établissement:', error);
        }
      );
    } else {
      this.establishmentForm.markAllAsTouched(); // Marquer tous les champs comme touchés pour afficher les messages d'erreur
    }
  }
}
