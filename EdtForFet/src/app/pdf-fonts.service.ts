import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class PdfFontsService {
  private fontCache: { amiri: string } | null = null;

  async loadFonts(doc: jsPDF): Promise<void> {
    try {
      // Load fonts from cache or fetch them
      if (!this.fontCache) {
        console.log('📥 Chargement de la police Amiri...');
        
        // Load Amiri font
        const amiriResponse = await fetch('/assets/fonts/Amiri.ttf');
        if (!amiriResponse.ok) {
          throw new Error(`Échec du chargement d'Amiri: ${amiriResponse.status}`);
        }
        const amiriBuffer = await amiriResponse.arrayBuffer();
        console.log(`✅ Amiri chargé: ${amiriBuffer.byteLength} bytes`);
        const amiriBase64 = this.arrayBufferToBase64(amiriBuffer);
        
        // Cache the font
        this.fontCache = {
          amiri: amiriBase64
        };
        
        console.log('✅ Police mise en cache');
      }
      
      // Add font to this specific jsPDF instance for all styles
      doc.addFileToVFS('Amiri.ttf', this.fontCache.amiri);
      doc.addFont('Amiri.ttf', 'Amiri', 'normal');
      doc.addFont('Amiri.ttf', 'Amiri', 'bold');
      doc.addFont('Amiri.ttf', 'Amiri', 'italic');
      doc.addFont('Amiri.ttf', 'Amiri', 'bolditalic');
      
      console.log('✅ Police Amiri enregistrée pour tous les styles');
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la police:', error);
      // Fallback to helvetica if font fails to load
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Reset fonts cache (useful for testing)
  resetFonts(): void {
    this.fontCache = null;
  }
}
