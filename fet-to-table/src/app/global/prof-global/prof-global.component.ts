import {Component, OnInit} from '@angular/core';
import {ActivityService} from "../../activities/activity.service";
import {Activity} from "../../activities/activity";
import {Planning} from "../../activities/planning";
import {Professor} from "../../professor/professor";
import {window} from "rxjs";

@Component({
  selector: 'app-prof-global',
  templateUrl: './prof-global.component.html',
  styleUrl: './prof-global.component.css'
})
export class ProfGlobalComponent implements OnInit {

  activityList: Activity[];
  professorList: string[] = [];
  daysOfWeek: string[] = ['الإٍثْنَيْن', 'الثٌلَاثَاء', 'الأَرْبِعَاء', 'الخَمِيس', 'الجُمُعَة', 'السَبْت']
  professorListActivity : Professor[] = [];
  tab: string[] = []

  constructor(
    private activityService: ActivityService
  ) {}

  ngOnInit() {// Add behavior to the collapsible list
    this.activityService.getActivityList().subscribe(activityList => this.activityList = activityList);
  }
  getListProfessor(){
    this.activityList.forEach((activity : Activity) => {
      const professorName = activity.teachers;
      if(!this.professorList.includes(professorName)){
        this.professorList.push(professorName)
      }
    })
    return this.professorList.sort()
  }

  getListActiviteByNameProf(): void {
    this.professorList.forEach(professorName => {
      const professor = new Professor();
      professor.name = professorName;
      if(this.activityList){
        professor.activities  = [];
        const T:string []= this.intializeTable();
        this.activityList.forEach((activity: Activity)=>{
          if(activity){
            if(activity.teachers == professorName){
              professor.activities.push(activity)
              const index = this.toIndex(activity.day, activity.hour);
              T[index] = activity.students_Sets+";"+activity.room+';'+activity.subject;
            }
          }
        })
        professor.T = this.tabWithColspan(T);
        console.log(professor.T)
        this.professorListActivity.push(professor)
      }
    });
  }
  getData() {
    this.professorList = []
    this.professorListActivity = []
    this.getListProfessor();
    this.getListActiviteByNameProf()
  }

  intializeTable(){
    const T:string[] = []
    for (let i = 0; i < 48; i++) {
      T[i] = ""
    }
    return T
  }

  toIndex(day : string, hour: string):any{
    //Lundi
    if(day == 'lundi_m' && hour == 'H1' )
      return 0;
    if(day == 'lundi_m' && hour == 'H2' )
      return 1;
    if(day == 'lundi_m' && hour == 'H3' )
      return 2;
    if(day == 'lundi_m' && hour == 'H4' )
      return 3;
    if(day == 'lundi_s' && hour == 'H1' )
      return 4;
    if(day == 'lundi_s' && hour == 'H2' )
      return 5;
    if(day == 'lundi_s' && hour == 'H3' )
      return 6;
    if(day == 'lundi_s' && hour == 'H4' )
      return 7;
    /////Mardi
    if(day == 'Mardi_m' && hour == 'H1' )
      return 8;
    if(day == 'Mardi_m' && hour == 'H2' )
      return 9;
    if(day == 'Mardi_m' && hour == 'H3' )
      return 10;
    if(day == 'Mardi_m' && hour == 'H4' )
      return 11;
    if(day == 'Mardi_s' && hour == 'H1' )
      return 12;
    if(day == 'Mardi_s' && hour == 'H2' )
      return 13;
    if(day == 'Mardi_s' && hour == 'H3' )
      return 14;
    if(day == 'Mardi_s' && hour == 'H4' )
      return 15;
    //Mercredi
    if(day == 'Mercredi_m' && hour == 'H1' )
      return 16;
    if(day == 'Mercredi_m' && hour == 'H2' )
      return 17;
    if(day == 'Mercredi_m' && hour == 'H3' )
      return 18;
    if(day == 'Mercredi_m' && hour == 'H4' )
      return 19;
    if(day == 'Mercredi_s' && hour == 'H1' )
      return 20;
    if(day == 'Mercredi_s' && hour == 'H2' )
      return 21;
    if(day == 'Mercredi_s' && hour == 'H3' )
      return 22;
    if(day == 'Mercredi_s' && hour == 'H4' )
      return 23;
    /////Jeudi
    if(day == 'Jeudi_m' && hour == 'H1' )
      return 24;
    if(day == 'Jeudi_m' && hour == 'H2' )
      return 25;
    if(day == 'Jeudi_m' && hour == 'H3' )
      return 26;
    if(day == 'Jeudi_m' && hour == 'H4' )
      return 27;
    if(day == 'Jeudi_s' && hour == 'H1' )
      return 28;
    if(day == 'Jeudi_s' && hour == 'H2' )
      return 29;
    if(day == 'Jeudi_s' && hour == 'H3' )
      return 30;
    if(day == 'Jeudi_s' && hour == 'H4' )
      return 31;
    //Vendredi
    if(day == 'Vendredi_m' && hour == 'H1' )
      return 32;
    if(day == 'Vendredi_m' && hour == 'H2' )
      return 33;
    if(day == 'Vendredi_m' && hour == 'H3' )
      return 34;
    if(day == 'Vendredi_m' && hour == 'H4' )
      return 35;
    if(day == 'Vendredi_s' && hour == 'H1' )
      return 36;
    if(day == 'Vendredi_s' && hour == 'H2' )
      return 37;
    if(day == 'Vendredi_s' && hour == 'H3' )
      return 38;
    if(day == 'Vendredi_s' && hour == 'H4' )
      return 39;
    /////Samedi
    if(day == 'Samedi_m' && hour == 'H1' )
      return 40;
    if(day == 'Samedi_m' && hour == 'H2' )
      return 41;
    if(day == 'Samedi_m' && hour == 'H3' )
      return 42;
    if(day == 'Samedi_m' && hour == 'H4' )
      return 43;
    if(day == 'Samedi_s' && hour == 'H1' )
      return 44;
    if(day == 'Samedi_s' && hour == 'H2' )
      return 45;
    if(day == 'Samedi_s' && hour == 'H3' )
      return 46;
    if(day == 'Samedi_s' && hour == 'H4' )
      return 47;
  }

  getColspan(cell: string, rows: string[], i: number): number {
    let colspan = 1;

      while ((i + colspan < rows.length &&
        cell == rows[i + colspan] )) {
        colspan++;
      }
    return colspan;
  }

  tabWithColspan(rows: string[]){
    let tab : string[] = rows;
    const exceptions = [7, 15, 23, 31, 39];
    for (let i = 0; i < rows.length-1; i++) {
      if(tab[i] == tab[i +1] && !exceptions.includes(i) && tab[i] != ''){
        tab[i] = tab[i] +'---'+2
        tab[i+1] = tab[i+1] +'---'+2
      }
      if(tab[i] == tab[i+1] && exceptions.includes(i) && !tab[i].includes('علوم الحياة والأرض') && !tab[i].includes('الفيزياء والكيمياء') && !tab[i].includes('التكنولوجيا'))
      {
        tab[i] = tab[i] +'*'
        tab[i+1] = tab[i+1] +'**'
      }
      if(tab[i] == tab[i+1] && tab[i] == ''){
        tab[i] = '*'
      }


    }
    return tab
  }
  deleteChar(cell : string, c: string ){
    return cell.replace(c, "");
}

}


