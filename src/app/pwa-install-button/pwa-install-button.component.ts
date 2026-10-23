import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../pwa-install.service';

@Component({
  selector: 'app-pwa-install-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button *ngIf="canInstall$ | async" 
            (click)="install()" 
            class="install-btn"
            title="تثبيت التطبيق">
      <span class="install-icon">📲</span>
      <span class="install-text">تثبيت التطبيق</span>
    </button>
  `,
  styles: `
    .install-btn {
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      transition: all 0.3s;
      animation: pulse 2s infinite;
    }
    
    .install-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    }
    
    .install-icon {
      font-size: 24px;
    }
    
    .install-text {
      direction: rtl;
    }
    
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }
      50% {
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.7);
      }
    }
    
    @media (max-width: 768px) {
      .install-btn {
        bottom: 70px;
        right: 10px;
        padding: 12px 20px;
        font-size: 14px;
      }
      
      .install-icon {
        font-size: 20px;
      }
      
      .install-text {
        display: none;
      }
    }
  `
})
export class PwaInstallButtonComponent {
  canInstall$ = this.pwaInstallService.canInstall$;

  constructor(private pwaInstallService: PwaInstallService) {}

  async install() {
    const accepted = await this.pwaInstallService.promptInstall();
    if (accepted) {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  }
}

