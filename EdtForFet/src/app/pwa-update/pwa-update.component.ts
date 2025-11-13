import { Component, OnInit } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showUpdatePrompt" class="update-prompt">
      <div class="update-content">
        <span class="update-icon">🔄</span>
        <p class="update-message">تحديث جديد متاح!</p>
        <button (click)="updateApp()" class="update-btn">تحديث الآن</button>
        <button (click)="dismissUpdate()" class="dismiss-btn">لاحقاً</button>
      </div>
    </div>
  `,
  styles: `
    .update-prompt {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideUp 0.4s ease-out;
      max-width: 90%;
      width: 400px;
    }
    
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
    
    .update-content {
      text-align: center;
    }
    
    .update-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 10px;
      animation: rotate 2s linear infinite;
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .update-message {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .update-btn,
    .dismiss-btn {
      margin: 10px 5px 0;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .update-btn {
      background: white;
      color: #667eea;
    }
    
    .dismiss-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    .update-btn:hover,
    .dismiss-btn:hover {
      transform: scale(1.05);
    }
  `
})
export class PwaUpdateComponent implements OnInit {
  showUpdatePrompt = false;

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      // Check for updates every 6 hours
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 6 * 60 * 60 * 1000);

      // Listen for version updates
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
        )
        .subscribe(() => {
          this.showUpdatePrompt = true;
        });
    }
  }

  updateApp() {
    this.showUpdatePrompt = false;
    document.location.reload();
  }

  dismissUpdate() {
    this.showUpdatePrompt = false;
  }
}

