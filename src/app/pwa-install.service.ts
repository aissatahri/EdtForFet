import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  public canInstall$ = new BehaviorSubject<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        this.deferredPrompt = e;
        // Update UI to notify the user they can install the PWA
        this.canInstall$.next(true);
      });

      window.addEventListener('appinstalled', () => {
        // Clear the deferredPrompt so it can be garbage collected
        this.deferredPrompt = null;
        this.canInstall$.next(false);
        console.log('PWA installed successfully! 🎉');
      });
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.canInstall$.next(false);

    return outcome === 'accepted';
  }
}
