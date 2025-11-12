import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeScolaireComponent } from "../annee-scolaire/annee-scolaire.component";
import { ProfesseurComponent } from "../professeur/professeur.component";
import { EtablissementComponent } from "../etablissement/etablissement.component";
import { PeriodeComponent } from "../periode/periode.component";
import { CreatePeriodeComponent } from '../periode/create-periode/create-periode.component';
import { NiveauComponent } from "../niveau/niveau.component";
import { SeanceComponent } from "../seance/seance.component";
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-parametre',
  standalone: true,
  imports: [CommonModule, AnneeScolaireComponent, ProfesseurComponent, EtablissementComponent, PeriodeComponent, CreatePeriodeComponent, NiveauComponent, SeanceComponent, TranslateModule],
  templateUrl: './parametre.component.html',
  styleUrls: ['./parametre.component.css']
})
export class ParametreComponent {

  openPanelId: string | null = null;
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
  }
  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
  }

  togglePanel(panelId: string): void {
    if (this.openPanelId === panelId) {
      this.openPanelId = null; // Ferme le panneau si déjà ouvert
    } else {
      this.openPanelId = panelId; // Ouvre le panneau
    }
  }

  isPanelOpen(panelId: string): boolean {
    return this.openPanelId === panelId;
  }
}
