import {Component, OnInit} from '@angular/core';
import {Activity} from "../../activities/activity";
import {ActivityService} from "../../activities/activity.service";
import {Professor} from "../professor";

declare var M: { Collapsible: { init: (elems: Element, options?: any) => any } };

@Component({
  selector: 'app-all-professor',
  templateUrl: './all-professor.component.html',
  styleUrl: './all-professor.component.css'
})
export class AllProfessorComponent implements OnInit{

  activityList : Activity[];
  professorList : string[] = [];
  professorListActivity : Professor[] = [];
  table : string[][] = []
  days = ['الإٍثْنَيْن', 'الثٌلَاثَاء', 'الأَرْبِعَاء', 'الخَمِيس', 'الجُمُعَة', 'السَبْت']
  constructor(
    private activityService : ActivityService
  ){}
  ngOnInit() {// Add behavior to the collapsible list
    this.activityService.getActivityList().subscribe(activityList => this.activityList = activityList);
  }
  intializeTable(){
    const T:string[][] = []
    for (let i = 0; i < 6; i++) {
      T[i] = []
      for (let j = 0; j <8; j++) {
        T[i][j] = "";
      }
    }
    return T
  }
  getListProfessor(){
    this.activityList.forEach((activity : Activity) => {
      if(activity.activity_Id === 191){
        let chaine = activity.students_Sets.split('+')
        console.log(chaine[0]+' '+chaine[1])
      }
      const professorName = activity.teachers;
      if(!this.professorList.includes(professorName)){
        this.professorList.push(professorName)
      }
    })
    return this.professorList.sort()
  }
  getData(){
    this.professorList = []
    this.professorListActivity = []
    this.getListProfessor();
    this.getListActiviteByNameProf()
    this.remplirTable(this.professorListActivity[1].activities);
    console.log(this.table)
  }
  getListActiviteByNameProf(): void {
    this.professorList.forEach(professorName => {
      const professor = new Professor();
      professor.name = professorName;
      if(this.activityList){
        professor.activities  = [];
        const T:string [][] = this.intializeTable();
        this.activityList.forEach((activity: Activity)=>{
          if(activity){
            if(activity.teachers == professorName){
              professor.activities.push(activity)
              const tab = this.toIndex(activity.day, activity.hour);
              T[tab[0]][tab[1]] = activity.students_Sets+";"+activity.room;
            }
          }
        })
        professor.table = T;
        console.log(professor.table)
        this.professorListActivity.push(professor)
      }
    });
  }
  remplirTable(activities : Activity[]) {
    this.table = this.intializeTable();
    activities.forEach((activity : Activity)=>{
      if(activity){
        const tab = this.toIndex(activity.day, activity.hour);
        this.table[tab[0]][tab[1]] = activity.students_Sets;
        console.log(tab)
      }
    })
    return this.table;
  }
  toIndex(day : string, hour: string):any{
    //Lundi
    if(day == 'lundi_m' && hour == 'H1' )
      return [0, 0];
    if(day == 'lundi_m' && hour == 'H2' )
      return [0, 1];
    if(day == 'lundi_m' && hour == 'H3' )
      return [0, 2];
    if(day == 'lundi_m' && hour == 'H4' )
      return [0, 3];
    if(day == 'lundi_s' && hour == 'H1' )
      return [0, 4];
    if(day == 'lundi_s' && hour == 'H2' )
      return [0, 5];
    if(day == 'lundi_s' && hour == 'H3' )
      return [0, 6];
    if(day == 'lundi_s' && hour == 'H4' )
      return [0, 7];
    /////Mardi
    if(day == 'Mardi_m' && hour == 'H1' )
      return [1, 0];
    if(day == 'Mardi_m' && hour == 'H2' )
      return [1, 1];
    if(day == 'Mardi_m' && hour == 'H3' )
      return [1, 2];
    if(day == 'Mardi_m' && hour == 'H4' )
      return [1, 3];
    if(day == 'Mardi_s' && hour == 'H1' )
      return [1, 4];
    if(day == 'Mardi_s' && hour == 'H2' )
      return [1, 5];
    if(day == 'Mardi_s' && hour == 'H3' )
      return [1, 6];
    if(day == 'Mardi_s' && hour == 'H4' )
      return [1, 7];
    //Mercredi
    if(day == 'Mercredi_m' && hour == 'H1' )
      return [2, 0];
    if(day == 'Mercredi_m' && hour == 'H2' )
      return [2, 1];
    if(day == 'Mercredi_m' && hour == 'H3' )
      return [2, 2];
    if(day == 'Mercredi_m' && hour == 'H4' )
      return [2, 3];
    if(day == 'Mercredi_s' && hour == 'H1' )
      return [2, 4];
    if(day == 'Mercredi_s' && hour == 'H2' )
      return [2, 5];
    if(day == 'Mercredi_s' && hour == 'H3' )
      return [2, 6];
    if(day == 'Mercredi_s' && hour == 'H4' )
      return [2, 7];
    /////Jeudi
    if(day == 'Jeudi_m' && hour == 'H1' )
      return [3, 0];
    if(day == 'Jeudi_m' && hour == 'H2' )
      return [3, 1];
    if(day == 'Jeudi_m' && hour == 'H3' )
      return [3, 2];
    if(day == 'Jeudi_m' && hour == 'H4' )
      return [3, 3];
    if(day == 'Jeudi_s' && hour == 'H1' )
      return [3, 4];
    if(day == 'Jeudi_s' && hour == 'H2' )
      return [3, 5];
    if(day == 'Jeudi_s' && hour == 'H3' )
      return [3, 6];
    if(day == 'Jeudi_s' && hour == 'H4' )
      return [3, 7];
    //Vendredi
    if(day == 'Vendredi_m' && hour == 'H1' )
      return [4, 0];
    if(day == 'Vendredi_m' && hour == 'H2' )
      return [4, 1];
    if(day == 'Vendredi_m' && hour == 'H3' )
      return [4, 2];
    if(day == 'Vendredi_m' && hour == 'H4' )
      return [4, 3];
    if(day == 'Vendredi_s' && hour == 'H1' )
      return [4, 4];
    if(day == 'Vendredi_s' && hour == 'H2' )
      return [4, 5];
    if(day == 'Vendredi_s' && hour == 'H3' )
      return [4, 6];
    if(day == 'Vendredi_s' && hour == 'H4' )
      return [4, 7];
    /////Samedi
    if(day == 'Samedi_m' && hour == 'H1' )
      return [5, 0];
    if(day == 'Samedi_m' && hour == 'H2' )
      return [5, 1];
    if(day == 'Samedi_m' && hour == 'H3' )
      return [5, 2];
    if(day == 'Samedi_m' && hour == 'H4' )
      return [5, 3];
    if(day == 'Samedi_s' && hour == 'H1' )
      return [5, 4];
    if(day == 'Samedi_s' && hour == 'H2' )
      return [5, 5];
    if(day == 'Samedi_s' && hour == 'H3' )
      return [5, 6];
    if(day == 'Samedi_s' && hour == 'H4' )
      return [5, 7];
  }
   getColspan(row: string, rows: string[], i: number): number {
    let colspan = 1;
    while (i + colspan < rows.length && row == rows[i + colspan]) {
      colspan++;
    }
    return colspan;
  }
}
