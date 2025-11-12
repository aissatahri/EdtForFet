import { Component } from '@angular/core';
import { ProfileComponent } from "../profile/profile.component";
import { UserCreateComponent } from "../utilisateur/user-create/user-create.component";
import { ProfesseurCreateComponent } from "../professeur/professeur-create/professeur-create.component";
import { AnneeScolaireCreateComponent } from "../annee-scolaire/annee-scolaire-create/annee-scolaire-create.component";
import { EtablissementCreateComponent } from "../etablissement/etablissement-create/etablissement-create.component";
import { ProfesseurEtablissementCreateComponent } from "../professeur-etablissement/professeur-etablissement-create/professeur-etablissement-create.component";
import { AnneeScolaireComponent } from "../annee-scolaire/annee-scolaire.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ProfileComponent, UserCreateComponent, ProfesseurCreateComponent, AnneeScolaireCreateComponent, EtablissementCreateComponent, ProfesseurEtablissementCreateComponent, AnneeScolaireComponent, CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  private modalInstance: any; // Type pour l'instance de la modale

  ngAfterViewInit() {
    const modalElement = document.getElementById('profileModal');
    if (modalElement) {
      this.modalInstance = new (window as any).bootstrap.Modal(modalElement);
    }
  }

  show() {
    if (this.modalInstance) {
      this.modalInstance.show();
    } else {
      console.error("La modale n'a pas été initialisée.");
    }
  }

  hide() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }
}
