import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router'; // Importez RouterModule
import { LanguageService } from '../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, TranslateModule, CommonModule], // Ajoutez RouterModule ici
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // Assurez-vous que c'est styleUrls, pas styleUrl
})
export class SidebarComponent implements OnInit{
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
  
}
