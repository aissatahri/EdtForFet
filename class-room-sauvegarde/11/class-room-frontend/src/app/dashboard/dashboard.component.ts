import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service'; // Importer le service de langue


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RouterOutlet, CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{
  isSidebarRight = false; // Détermine si la sidebar est à droite (pour l'arabe)

  constructor(private authService: AuthService, private languageService: LanguageService) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      // Redirection ou affichage d'un message pour l'utilisateur non connecté
    }
     // Abonnez-vous aux changements de langue et ajustez la position de la sidebar
     this.languageService.currentLanguage$.subscribe(lang => {
      this.isSidebarRight = lang === 'ar'; // Sidebar à droite si langue arabe
    });
  } 
  isSidebarVisible = true;

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.toggle('shifted', !this.isSidebarVisible);
    }
  }
}
