import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilisateurService } from '../../services/utilisateur.service';
import { UtilisateurDto } from '../../api';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css',
})
export class UserCreateComponent {
  userForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UtilisateurService
  ) {
    console.log('UserCreateComponent Initialized');
  }

  ngOnInit(): void {
    console.log('Form Initialized');
    this.userForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateDeNaissance: [''],
      motDePasse: ['', Validators.required],
    });
  }

  createUser(): void {
    console.log('Form Values:', this.userForm.value);
    console.log('Form Status:', this.userForm.status);
    
    if (this.userForm.valid) {
      const formData = { ...this.userForm.value };
      
      // Convertir la date en format ISO si nécessaire
      if (formData.dateDeNaissance) {
        formData.dateDeNaissance = new Date(formData.dateDeNaissance).toISOString();
      }
  
      console.log('Sending Request with Data:', formData); // Log des données avant envoi
  
      this.userService.createUtilisateur(formData).subscribe(
        response => {
          console.log('Utilisateur créé:', response);
          
          // Réinitialiser le formulaire
          this.userForm.reset();
          
          // Afficher le modal de succès
          const successModal = new (window as any).bootstrap.Modal(document.getElementById('successModal'));
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

