import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PwaInstallService } from '../pwa-install.service';

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
  canInstall$ = this.pwaInstallService.canInstall$;
  isInstalled = false;

  constructor(
    private http: HttpClient,
    private pwaInstallService: PwaInstallService
  ) {}

  ngOnInit() {
    this.loadVisitorInfo();
    this.updateVisitorCount();
    this.checkIfInstalled();
  }

  checkIfInstalled() {
    // Check if app is running in standalone mode (installed as PWA)
    if (typeof window !== 'undefined') {
      this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    }
  }

  async installPwa() {
    const accepted = await this.pwaInstallService.promptInstall();
    if (accepted) {
      console.log('PWA installée avec succès ! 🎉');
      // After installation, check again
      setTimeout(() => this.checkIfInstalled(), 1000);
    }
  }

  async uninstallPwa() {
    if (confirm('هل تريد حقاً إلغاء تثبيت التطبيق؟\n\nستحتاج إلى إعادة تثبيته من المتصفح إذا غيرت رأيك.')) {
      alert('لإلغاء التثبيت:\n\n' +
            '📱 على الهاتف:\n' +
            '- اضغط مطولاً على أيقونة التطبيق\n' +
            '- اختر "إزالة" أو "حذف التطبيق"\n\n' +
            '💻 على الكمبيوتر:\n' +
            '- افتح chrome://apps\n' +
            '- انقر بزر الماوس الأيمن على التطبيق\n' +
            '- اختر "إزالة من Chrome"');
    }
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
