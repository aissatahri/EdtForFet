import {Component, OnInit, signal} from '@angular/core';
import {ActivityService} from "../../activities/activity.service";
import {Activity} from "../../activities/activity";
import {Room} from "../room";

@Component({
  selector: 'app-all-room',
  templateUrl: './all-room.component.html',
  styleUrl: './all-room.component.css'
})
export class AllRoomComponent implements OnInit{

  days = ['الإٍثْنَيْن', 'الثٌلَاثَاء', 'الأَرْبِعَاء', 'الخَمِيس', 'الجُمُعَة', 'السَبْت'];
  activityList: Activity[];
  roomList: string[] = [];
  listRoomActivity: Room [];
  tableResult: string [][]=[];


  constructor(
    private activityService: ActivityService
  ) {
  }

  ngOnInit(): void {
    this.activityService.getActivityList().subscribe(activityList => this.activityList = activityList);
  }
  getData(){
    this.roomList = []
    this.getListRoom();
    console.log(this.roomList);
    this.getListActivityInRoom();
    console.log(this.listRoomActivity)

  }

  getListRoom() {
    this.activityList.forEach((activity: Activity) => {
      const roomName = activity.room;
      if (!this.roomList.includes(roomName)) {
        this.roomList.push(roomName)
      }
    })
    this.roomList.sort()
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

  getListActivityInRoom(){
    this.listRoomActivity  = []
    this.roomList.forEach((salle : string)=>{
      const room : Room = new Room();
      room.name = salle;
      const T: string [][] = this.intializeTable();
      this.activityList.forEach((activity: Activity)=>{
        if(activity.room == room.name){
          room.activities.push(activity)
          const tab = this.toIndex(activity.day, activity.hour);
             T[tab[0]][tab[1]] = activity.teachers + " (" + activity.subject + ") ; " + activity.students_Sets;
        }
      })
      room.table = T
      this.listRoomActivity.push(room)
    })
    return this.listRoomActivity
  }

  createListActivityRoom(){


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

  stringLength(ch : string){
    const chaine : string[] = ch.split(';')
    return chaine.length
  }

  test(): boolean{

  const ch: string = "SInfo;S5;S8;S4;S9;SVT2;S18;S16;S17;S12;S10;S1;ملاعب;S7;S11;S15;PC2;SVT1;PC1;S19;S20;S3"
    return ch.includes('S2')
}
}
