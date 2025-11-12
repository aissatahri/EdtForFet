import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelEditService {
  constructor() {}

  // Méthode pour lire le fichier Excel
  readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();
      reader.onload = (e) => {
        const binaryStr: string = e.target?.result as string;
        const wb: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

        // Supposons que vous avez une seule feuille de calcul
        const ws: XLSX.WorkSheet = wb.Sheets[wb.SheetNames[0]];
        
        // Convertir la feuille de calcul en tableau JSON
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        resolve(data);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      // Lire le fichier en tant que binaire
      reader.readAsBinaryString(file);
    });
  }

  // Méthode pour modifier les notes et enregistrer le fichier Excel
  modifyNotes(file: File, updatedData: any[]): void {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const binaryStr: string = e.target?.result as string;
      const wb: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' });

      // Supposons que vous avez une seule feuille de calcul
      const ws: XLSX.WorkSheet = wb.Sheets[wb.SheetNames[0]];
      
      // Mettre à jour les données dans la feuille
      const newWorksheet = XLSX.utils.aoa_to_sheet(updatedData);
      wb.Sheets[wb.SheetNames[0]] = newWorksheet;

      // Enregistrer le fichier modifié
      XLSX.writeFile(wb, file.name);
    };

    reader.readAsBinaryString(file);
  }
}
