import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProfesseurService } from '../../services/professeur.service';
import { UtilisateurService } from '../../services/utilisateur.service';
import { UtilisateurDto } from '../../api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-professeur-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './professeur-create.component.html',
  styleUrls: ['./professeur-create.component.css'],
})
export class ProfesseurCreateComponent implements OnInit {
  professorForm!: FormGroup;
  utilisateurs: UtilisateurDto[] = []; // Liste des utilisateurs à afficher dans la combobox

  constructor(
    private fb: FormBuilder,
    private professorService: ProfesseurService,
    private utilisateurService: UtilisateurService // Pour récupérer les utilisateurs
  ) {}

  ngOnInit(): void {
    // Initialiser le formulaire
    this.professorForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      utilisateurId: ['', Validators.required], // Sélectionner un utilisateur
    });
// S'abonner aux changements dans la liste des utilisateurs
this.utilisateurService.getUtilisateurs().subscribe((data: UtilisateurDto[]) => {
  this.utilisateurs = data;
});

// Charger initialement les utilisateurs
this.utilisateurService.updateUtilisateurs();
  }

 

  // Créer le professeur
  createProfessor(): void {
    if (this.professorForm.valid) {
      const formData = { ...this.professorForm.value };

      // Trouver l'utilisateur sélectionné
      const selectedUtilisateur = this.utilisateurs.find(
        (user) => user.id === +formData.utilisateurId
      );

      console.log('Utilisateur sélectionné:', selectedUtilisateur); // Ajoutez ce log pour vérifier l'utilisateur trouvé
      console.log('ID utilisateur du formulaire:', formData.utilisateurId); // Ajoutez ce log pour vérifier l'ID utilisateur

      if (!selectedUtilisateur) {
        console.error('Utilisateur sélectionné non trouvé');
        return;
      }

      const professeurDto = {
        idProfesseur: 0, // Valeur par défaut pour un nouvel enregistrement
        nom: formData.nom,
        prenom: formData.prenom,
        utilisateurDto: selectedUtilisateur, // Ajouter l'objet utilisateur complet
      };

      console.log('Sending request:', professeurDto); // Pour déboguer l'objet envoyé

      this.professorService.createProfesseur(professeurDto).subscribe(
        (response) => {
          console.log('Professeur créé:', response);

          // Réinitialiser le formulaire après succès
          this.professorForm.reset();


          // Afficher le modal de succès
          const successModal = new (window as any).bootstrap.Modal(document.getElementById('successModalProf'));
          successModal.show();
},
        error => {
          console.error('Error:', error); // Log des erreurs
        }
      );
    } else {
      console.log('Formulaire invalide');
    }
  }
}


