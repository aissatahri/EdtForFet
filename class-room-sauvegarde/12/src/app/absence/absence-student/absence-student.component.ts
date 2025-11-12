import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { AbsenceService } from '../../services/absence.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AbsenceDto } from '../../api';
import { ChangeDetectorRef } from '@angular/core'; // Importer ChangeDetectorRef
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-absence-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './absence-student.component.html',
  styleUrl: './absence-student.component.css'
})
export class AbsenceStudentComponent implements OnInit {

  @Input() idEleve!: number; // Recevoir l'ID de l'élève
  absencesParPeriode: Map<string, AbsenceDto[]> = new Map(); // Stocker les absences par période
  currentLang: string = 'fr'; // Langue par défaut
  constructor(
    private absenceService: AbsenceService,
    private cdRef: ChangeDetectorRef,  // Injecter ChangeDetectorRef
    private languageService: LanguageService, 
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('fr'); // Définit la langue par défaut
    this.translate.use(this.languageService.getCurrentLanguage()); // Utilise la langue actuelle
  }

  ngOnInit(): void {
    this.currentLang = this.languageService.getCurrentLanguage();
    console.log(this.currentLang); // Vérifiez la valeur ici
    this.languageService.setLanguageDirection(this.currentLang);
    // Charger les absences de l'élève au démarrage du composant
    this.absenceService.findByEleveId(this.idEleve).subscribe(absences => {
      this.organiserAbsencesParPeriode(absences);
      this.cdRef.detectChanges();  // Forcer la détection des changements ici
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idEleve']) {
      this.resetAbsences(); // Réinitialiser les absences
      this.loadAbsences(); // Charger les nouvelles absences
    }
  }

  loadAbsences() {
    this.absenceService.findByEleveId(this.idEleve).subscribe(absences => {
      this.organiserAbsencesParPeriode(absences);
    });
  }

  resetAbsences() {
    this.absencesParPeriode.clear(); // Effacer les absences existantes
  }

  // Fonction pour organiser les absences par période
  organiserAbsencesParPeriode(absences: AbsenceDto[]): void {
    absences.forEach(absence => {
      const periodeLibelle = absence.periode?.libelle || 'Période inconnue';
      
      if (!this.absencesParPeriode.has(periodeLibelle)) {
        this.absencesParPeriode.set(periodeLibelle, []);
      }
      
      this.absencesParPeriode.get(periodeLibelle)?.push(absence);
    });
  }
}
