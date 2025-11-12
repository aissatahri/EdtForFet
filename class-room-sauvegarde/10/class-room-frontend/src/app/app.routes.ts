import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClasseComponent } from './classe/classe.component';
import { MarkComponent } from './mark/mark.component';
import { AbsenceComponent } from './absence/absence.component';
import { CahiertexteComponent } from './cahiertexte/cahiertexte.component';
import { StudentComponent } from './student/student.component';
import { HomeComponent } from './home/home.component';
import { ParametreComponent } from './parametre/parametre.component';
import { AuthentificationComponent } from './authentification/authentification.component';
import { EleveListComponent } from './student/eleve-list/eleve-list.component';
import { NewEleveComponent } from './student/new-eleve/new-eleve.component';
import { ListAbsenceComponent } from './absence/list-absence/list-absence.component';
import { MarkStudentComponent } from './mark/mark-student/mark-student.component';

// Configuration des routes pour votre application
export const routes: Routes = [
  { path: 'login', component: AuthentificationComponent },   // Page de connexion
  { 
    path: 'dash', component: DashboardComponent,   // Dashboard avec le menu latéral et le contenu
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },  // Redirection vers 'home'
      { path: 'home', component: HomeComponent },     // Page d'accueil
      //{ path: 'classe', component: ClasseComponent }, // Page Classe
      { path: 'lstEleve', component: EleveListComponent }, // Page Classe-eleve
      { path: 'eleve', component: NewEleveComponent }, // Page Élève
      { path: 'mark', component: MarkComponent },     // Page Mark
      { path: 'elevenote', component: MarkStudentComponent }, // Page ÉlèveNote
      { path: 'absence', component: AbsenceComponent }, // Page Absence
      { path: 'absences', component: ListAbsenceComponent }, // Page liste Absence
      { path: 'cahier-texte', component: CahiertexteComponent }, // Page Cahier de texte
      { path: 'parametre', component: ParametreComponent }, // Page parametre
      { path: 'student/:id', component: StudentComponent }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirection vers login si l'URL est vide
  { path: '**', redirectTo: '/login' } // Redirection en cas d'URL non reconnue
];
