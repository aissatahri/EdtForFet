import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private email: string | null = null;
  private etablissementId: number | null = null;
  private anneeScolaireId: number | null = null;

  // Méthode pour stocker les informations utilisateur
  setUserData(email: string, etablissementId: number, anneeScolaireId: number): void {
    this.email = email;
    this.etablissementId = etablissementId;
    this.anneeScolaireId = anneeScolaireId;
  }

  // Méthode pour obtenir les informations utilisateur
  getUserData() {
    return {
      email: this.email,
      etablissementId: this.etablissementId,
      anneeScolaireId: this.anneeScolaireId,
    };
  }

  // Méthode pour vérifier si les données utilisateur sont présentes
  isUserLoggedIn(): boolean {
    return !!this.email && !!this.etablissementId && !!this.anneeScolaireId;
  }

  // Méthode pour effacer les données utilisateur (par exemple lors de la déconnexion)
  clearUserData(): void {
    this.email = null;
    this.etablissementId = null;
    this.anneeScolaireId = null;
  }
}
