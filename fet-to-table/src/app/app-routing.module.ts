import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AllProfessorComponent} from "./professor/all-professor/all-professor.component";
import {AllStudentComponent} from "./student/all-student/all-student.component";
import {AllRoomComponent} from "./room/all-room/all-room.component";
import {ProfGlobalComponent} from "./global/prof-global/prof-global.component";

const routes: Routes = [
  {path : 'all-professor', component : AllProfessorComponent},
  {path : 'all-student', component : AllStudentComponent},
  {path : 'all-room', component : AllRoomComponent},
  {path : 'prof-global', component : ProfGlobalComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
