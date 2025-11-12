import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  // Initialisation directe du BehaviorSubject
  private currentLanguageSubject: BehaviorSubject<string>;
  currentLanguage$; // Observable pour surveiller les changements de langue

  constructor() {
    // Récupérer la langue du localStorage ou définir par défaut le français
    const savedLanguage = localStorage.getItem('appLanguage') || 'fr';
    
    // Initialiser BehaviorSubject avec la langue enregistrée ou la langue par défaut
    this.currentLanguageSubject = new BehaviorSubject<string>(savedLanguage);

    // Initialiser l'observable après avoir créé le BehaviorSubject
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();

    // Appliquer immédiatement la direction de la page selon la langue
    this.setLanguageDirection(savedLanguage);
  }

  // Method to change the language
  setLanguage(lang: string): void {
    this.currentLanguageSubject.next(lang);
    // Enregistrer la langue sélectionnée dans localStorage
    localStorage.setItem('appLanguage', lang);
    // Changer la direction et la langue de la page
    this.setLanguageDirection(lang);
  }

  // Method to set the page direction based on language
  public setLanguageDirection(lang: string): void {
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'fr');
    }
  }

  // Method to retrieve the current language
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }
}
