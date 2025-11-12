import {Component, OnInit} from '@angular/core';
import {ActivityService} from "../../activities/activity.service";
import {Activity} from "../../activities/activity";
import {Student} from "../student";


@Component({
  selector: 'app-all-student',
  templateUrl: './all-student.component.html',
  styleUrl: './all-student.component.css'
})
export class AllStudentComponent implements OnInit {

  activityList: Activity[];
  studentList: string[] = [];
  studentListActivity: Student[] = [];
  listActivityWithoutGroup: Activity[] = [];
  list: Activity[] = []
  table: string[][] = []
  tableau: any[][][] = [];
  days = ['الإٍثْنَيْن', 'الثٌلَاثَاء', 'الأَرْبِعَاء', 'الخَمِيس', 'الجُمُعَة', 'السَبْت'];

  constructor(
    private activityService: ActivityService
  ) {
  }

  ngOnInit(): void {
    this.activityService.getActivityList().subscribe(activityList => this.activityList = activityList);
  }

  intializeTable() {
    const T: string[][] = []
    for (let i = 0; i < 6; i++) {
      T[i] = []
      for (let j = 0; j < 8; j++) {
        T[i][j] = "";
      }
    }
    return T
  }

  getListStudent() {
    this.activityList.forEach((activity: Activity) => {
      const studentName = activity.students_Sets;
      if (!this.studentList.includes(studentName)) {
        this.studentList.push(studentName)
      }
    })
    this.studentList.sort()
  }

  getData() {
    this.studentList = [];
    this.listActivityWithoutGroup = [];
    this.studentListActivity = []
    this.list = [];
    this.getListStudent();
    this.createListStudentWithoutG();
    this.getListActiviteByNameStudent();
  }

  getListActiviteByNameStudent() {
    this.studentList.forEach(studentName => {
      const student: Student = new Student();
      if (!studentName.includes("G")) {
        student.grade = studentName;
        if (this.listActivityWithoutGroup) {
          student.activities = [];
          const T: string [][] = this.intializeTable();
          this.listActivityWithoutGroup.forEach((activity: Activity) => {
            if (activity.students_Sets === student.grade) {
              student.activities.push(activity)
              const tab = this.toIndex(activity.day, activity.hour);
              if (T[tab[0]][tab[1]] !== "") {
                T[tab[0]][tab[1]] += ';' + activity.subject + ":" + activity.comments + ":" + activity.room;
              } else {
                T[tab[0]][tab[1]] = activity.subject + " " + activity.comments + " " + activity.room;
              }
            }
          })
          student.table = T;
          this.studentListActivity.push(student)
        }
      }
    });
    return this.studentListActivity
  }

  createListStudentWithoutG() {
    this.listActivityWithoutGroup = []
    this.activityList.forEach((activity: Activity) => {
      if (!activity.students_Sets.includes('G') && !activity.students_Sets.includes('+')) {
        let res: Activity = new Activity();
        res = activity
        res.students_Sets = activity.students_Sets;
        this.listActivityWithoutGroup.push(res)
      }
      if (activity.students_Sets.includes('G') && !activity.students_Sets.includes('+')) {
        let res: Activity = new Activity();
        res = activity
        let ch: string [] = this.splitChaine(activity.students_Sets, ':')
        res.students_Sets = ch[0]
        res.comments = ch[1]
        this.listActivityWithoutGroup.push(res)
      }
      if (activity.students_Sets.includes('+')) {
        let chaine: string[] = activity.students_Sets.split('+');
        for (let i = 0; i < chaine.length; i++) {
          const res: Activity = new Activity();
          res.students_Sets = this.splitChaine(chaine[i], ':')[0]
          res.comments = this.splitChaine(chaine[i], ':')[1]
          res.activity_Id = activity.activity_Id
          res.day = activity.day
          res.hour = activity.hour
          res.teachers = activity.teachers;
          res.room = activity.room
          res.subject = activity.subject
          res.activity_Tags = activity.activity_Tags
          this.listActivityWithoutGroup.push(res)
        }
      }
    })
    return this.listActivityWithoutGroup;
  }

  splitChaine(ch: string, c: any) {
    let chaine: string[] = ch.split(c)
    return [chaine[0], chaine[1]]
  }

  toIndex(day: string, hour: string): any {
    //Lundi
    if (day == 'lundi_m' && hour == 'H1')
      return [0, 0];
    if (day == 'lundi_m' && hour == 'H2')
      return [0, 1];
    if (day == 'lundi_m' && hour == 'H3')
      return [0, 2];
    if (day == 'lundi_m' && hour == 'H4')
      return [0, 3];
    if (day == 'lundi_s' && hour == 'H1')
      return [0, 4];
    if (day == 'lundi_s' && hour == 'H2')
      return [0, 5];
    if (day == 'lundi_s' && hour == 'H3')
      return [0, 6];
    if (day == 'lundi_s' && hour == 'H4')
      return [0, 7];
    /////Mardi
    if (day == 'Mardi_m' && hour == 'H1')
      return [1, 0];
    if (day == 'Mardi_m' && hour == 'H2')
      return [1, 1];
    if (day == 'Mardi_m' && hour == 'H3')
      return [1, 2];
    if (day == 'Mardi_m' && hour == 'H4')
      return [1, 3];
    if (day == 'Mardi_s' && hour == 'H1')
      return [1, 4];
    if (day == 'Mardi_s' && hour == 'H2')
      return [1, 5];
    if (day == 'Mardi_s' && hour == 'H3')
      return [1, 6];
    if (day == 'Mardi_s' && hour == 'H4')
      return [1, 7];
    //Mercredi
    if (day == 'Mercredi_m' && hour == 'H1')
      return [2, 0];
    if (day == 'Mercredi_m' && hour == 'H2')
      return [2, 1];
    if (day == 'Mercredi_m' && hour == 'H3')
      return [2, 2];
    if (day == 'Mercredi_m' && hour == 'H4')
      return [2, 3];
    if (day == 'Mercredi_s' && hour == 'H1')
      return [2, 4];
    if (day == 'Mercredi_s' && hour == 'H2')
      return [2, 5];
    if (day == 'Mercredi_s' && hour == 'H3')
      return [2, 6];
    if (day == 'Mercredi_s' && hour == 'H4')
      return [2, 7];
    /////Jeudi
    if (day == 'Jeudi_m' && hour == 'H1')
      return [3, 0];
    if (day == 'Jeudi_m' && hour == 'H2')
      return [3, 1];
    if (day == 'Jeudi_m' && hour == 'H3')
      return [3, 2];
    if (day == 'Jeudi_m' && hour == 'H4')
      return [3, 3];
    if (day == 'Jeudi_s' && hour == 'H1')
      return [3, 4];
    if (day == 'Jeudi_s' && hour == 'H2')
      return [3, 5];
    if (day == 'Jeudi_s' && hour == 'H3')
      return [3, 6];
    if (day == 'Jeudi_s' && hour == 'H4')
      return [3, 7];
    //Vendredi
    if (day == 'Vendredi_m' && hour == 'H1')
      return [4, 0];
    if (day == 'Vendredi_m' && hour == 'H2')
      return [4, 1];
    if (day == 'Vendredi_m' && hour == 'H3')
      return [4, 2];
    if (day == 'Vendredi_m' && hour == 'H4')
      return [4, 3];
    if (day == 'Vendredi_s' && hour == 'H1')
      return [4, 4];
    if (day == 'Vendredi_s' && hour == 'H2')
      return [4, 5];
    if (day == 'Vendredi_s' && hour == 'H3')
      return [4, 6];
    if (day == 'Vendredi_s' && hour == 'H4')
      return [4, 7];
    /////Samedi
    if (day == 'Samedi_m' && hour == 'H1')
      return [5, 0];
    if (day == 'Samedi_m' && hour == 'H2')
      return [5, 1];
    if (day == 'Samedi_m' && hour == 'H3')
      return [5, 2];
    if (day == 'Samedi_m' && hour == 'H4')
      return [5, 3];
    if (day == 'Samedi_s' && hour == 'H1')
      return [5, 4];
    if (day == 'Samedi_s' && hour == 'H2')
      return [5, 5];
    if (day == 'Samedi_s' && hour == 'H3')
      return [5, 6];
    if (day == 'Samedi_s' && hour == 'H4')
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
