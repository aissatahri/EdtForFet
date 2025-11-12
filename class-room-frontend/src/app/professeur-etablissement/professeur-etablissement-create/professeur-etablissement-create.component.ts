import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EtablissementProfesseurService } from '../../services/etablissementprofesseur.service';
import { ProfesseurService } from '../../services/professeur.service';
import { EtablissementService } from '../../services/etablissement.service';
import { AnneeScolaireService } from '../../services/annee-scolaire.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-professeur-etablissement-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './professeur-etablissement-create.component.html',
  styleUrl: './professeur-etablissement-create.component.css'
})
export class ProfesseurEtablissementCreateComponent implements OnInit {
  relationForm!: FormGroup;
  professors$: Observable<any[]>;
  establishments$: Observable<any[]>;
  academicYears$: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private professorEstablishmentService: EtablissementProfesseurService,
    private professorService: ProfesseurService,
    private establishmentService: EtablissementService,
    private academicYearService: AnneeScolaireService
  ) {
    this.professors$ = this.professorService.professors$;
    this.establishments$ = this.establishmentService.establishments$;
    this.academicYears$ = this.academicYearService.anneesScolaires$;
  }

  ngOnInit(): void {
    this.relationForm = this.fb.group({
      professorId: [''],
      establishmentId: [''],
      academicYearId: ['']
    });

    this.loadProfessors();
    this.loadEstablishments();
    this.loadAcademicYears();
  }

  loadProfessors(): void {
    this.professorService.getAllProfesseurs().subscribe();
  }

  loadEstablishments(): void {
    this.establishmentService.findAll().subscribe();
  }

  loadAcademicYears(): void {
    this.academicYearService.findAll().subscribe();
  }

  createProfessorEstablishment(): void {
    if (this.relationForm.valid) {
      const professorId = this.relationForm.get('professorId')?.value;
      const establishmentId = this.relationForm.get('establishmentId')?.value;
      const academicYearId = this.relationForm.get('academicYearId')?.value;

      if (professorId && establishmentId && academicYearId) {
        this.professorService.getProfesseurById(professorId).subscribe(professor => {
          this.establishmentService.getEtablissementById(establishmentId).subscribe(establishment => {
            this.academicYearService.findById(academicYearId).subscribe(academicYear => {
              const requestPayload = {
                idEtablissementProfesseur: 0,
                professeur: {
                  idProfesseur: professor.idProfesseur,
                  nom: professor.nom,
                  prenom: professor.prenom,
                  utilisateurDto: professor.utilisateurDto
                },
                etablissement: {
                  idEtablissement: establishment.idEtablissement,
                  libelle: establishment.libelle,
                  telephone: establishment.telephone,
                  adresse: establishment.adresse
                },
                anneeScolaire: {
                  idAnneeScolaire: academicYear.idAnneeScolaire,
                  libelle: academicYear.libelle,
                  dateDebut: academicYear.dateDebut,
                  dateFin: academicYear.dateFin
                }
              };

              console.log('Request Payload:', requestPayload);

              // Envoi des données au backend
              this.professorEstablishmentService.create(requestPayload).subscribe(response => {
                console.log('Relation créée:', response);

                // Afficher le modal de succès
                const successModal = new (window as any).bootstrap.Modal(document.getElementById('successModalprofile'));
                successModal.show();
              }, error => {
                console.error('Erreur lors de la création de la relation:', error);
              });
            });
          });
        });
      }
    }
  }
}
