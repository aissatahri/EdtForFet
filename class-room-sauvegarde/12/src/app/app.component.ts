import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LanguageService } from './services/language.service';
import { TranslateService } from '@ngx-translate/core'; // Importer TranslateService
import { TranslationModule } from '../translation.module';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet ,HttpClientModule, TranslationModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'class-room-frontend';
  currentLanguage!: string;
  constructor(
    private http: HttpClient, 
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Récupérer la langue préférée stockée ou par défaut 'fr'
    const storedLanguage = localStorage.getItem('appLanguage');
    this.currentLanguage = storedLanguage ? storedLanguage : 'fr';

    // Charger les traductions
    this.translate.setDefaultLang(this.currentLanguage);
    this.translate.use(this.currentLanguage);

    // S'abonner aux changements de langue
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.translate.use(lang);
    });
  }
}
