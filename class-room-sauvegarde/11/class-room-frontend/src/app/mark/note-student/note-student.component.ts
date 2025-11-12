import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { DevoirEleveService } from '../../services/devoir-eleve.service';
import { EleveDevoirDto } from '../../api';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { TranslateService, TranslateModule} from '@ngx-translate/core';
@Component({
  selector: 'app-note-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './note-student.component.html',
  styleUrls: ['./note-student.component.css'],
})
export class NoteStudentComponent implements OnInit {
  currentLang: string = 'fr'; // Langue par défaut
  
  devoirsParPeriode: Map<string, EleveDevoirDto[]> = new Map(); // Map pour regrouper les devoirs par période

  @Input() idEleve!: number;

  constructor(
    private elevedevoirService: DevoirEleveService,
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
    this.elevedevoirService.findAllByEleve(this.idEleve).subscribe(
      (devoirs: EleveDevoirDto[]) => {
        console.log(devoirs)
        this.regrouperDevoirsParPeriode(devoirs);
      },
      error => {
        console.error('Erreur lors du chargement des devoirs:', error);
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idEleve']) {
      this.resetNotes(); // Réinitialiser les notes
      this.loadNotes(); // Charger les nouvelles notes
    }
  }

  loadNotes() {
    this.elevedevoirService.findAllByEleve(this.idEleve).subscribe(
      (devoirs: EleveDevoirDto[]) => {
        console.log('Devoirs chargés pour l\'élève ID:', this.idEleve, devoirs);
        this.regrouperDevoirsParPeriode(devoirs);
      },
      error => {
        console.error('Erreur lors du chargement des devoirs:', error);
      }
    );
  }

  resetNotes() {
    this.devoirsParPeriode.clear(); // Effacer les devoirs existants
  }

  private regrouperDevoirsParPeriode(devoirs: EleveDevoirDto[]): void {
    this.resetNotes(); // Assurez-vous de réinitialiser avant de regrouper les devoirs
    devoirs.forEach(devoir => {
      const periodeLibelle = devoir.devoir?.periode?.libelle || 'Non défini';
      if (!this.devoirsParPeriode.has(periodeLibelle)) {
        this.devoirsParPeriode.set(periodeLibelle, []);
      }
      const listeDevoirs = this.devoirsParPeriode.get(periodeLibelle);
      
      // Vérifier si le devoir est déjà dans la liste pour éviter la duplication
      const existeDeja = listeDevoirs?.some(d => d.idEleveDevoir === devoir.idEleveDevoir);
      if (!existeDeja) {
        listeDevoirs?.push(devoir);
      }
    });
  }
  

  // Méthode pour obtenir un tableau des clés
  get periodeKeys(): string[] {
    return Array.from(this.devoirsParPeriode.keys());
  }
}
