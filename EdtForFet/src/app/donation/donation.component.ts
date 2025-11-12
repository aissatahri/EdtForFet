import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-donation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.css']
})
export class DonationComponent {
  showDonationModal = false;
  rib = 'RIB: 157 570 2111180350290005 25';
  
  // Variable pour activer/désactiver la donation
  isDonationEnabled = true;
  
  donationAmounts = [
    { amount: 50, color: 'blue' },
    { amount: 20, color: 'pink' },
    { amount: 10, color: 'purple' }
  ];

  constructor() {
    // Vérifier la variable d'environnement
    // Sur Vercel, on peut définir ENABLE_DONATION=false
    const enableDonation = (window as any).ENABLE_DONATION;
    if (enableDonation !== undefined) {
      this.isDonationEnabled = enableDonation === 'true' || enableDonation === true;
    }
  }

  openDonationModal() {
    this.showDonationModal = true;
  }

  closeDonationModal() {
    this.showDonationModal = false;
  }

  donateWithPayPal(amount: number) {
    // Redirection vers PayPal avec le montant
    const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID&amount=${amount}&currency_code=MAD`;
    window.open(paypalUrl, '_blank');
  }

  copyRIB() {
    navigator.clipboard.writeText('157 570 2111180350290005 25').then(() => {
      alert('RIB copié dans le presse-papier !');
    });
  }
}
