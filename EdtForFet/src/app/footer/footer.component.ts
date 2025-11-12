import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  showAboutModal = false;
  currentYear = new Date().getFullYear();
  visitorCity = '';
  visitorCountry = '';
  visitorCount = 0;
  showVisitorInfo = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadVisitorInfo();
    this.updateVisitorCount();
  }

  loadVisitorInfo() {
    // Utiliser ipapi.co pour obtenir la géolocalisation
    this.http.get<any>('https://ipapi.co/json/').subscribe({
      next: (data) => {
        this.visitorCity = data.city || 'Inconnue';
        this.visitorCountry = data.country_name || 'Inconnu';
        this.showVisitorInfo = true;
      },
      error: (err) => {
        console.log('Géolocalisation non disponible');
        this.visitorCity = 'Non disponible';
        this.visitorCountry = 'Non disponible';
        this.showVisitorInfo = true;
      }
    });
  }

  updateVisitorCount() {
    // Compteur simple dans localStorage
    const count = localStorage.getItem('visitorCount');
    if (count) {
      this.visitorCount = parseInt(count) + 1;
    } else {
      this.visitorCount = 1;
    }
    localStorage.setItem('visitorCount', this.visitorCount.toString());
  }

  openAboutModal() {
    this.showAboutModal = true;
  }

  closeAboutModal() {
    this.showAboutModal = false;
  }
}
