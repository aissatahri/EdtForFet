import {Activity} from "../activities/activity";

export class Student{
  grade : string;
  group : string;
  activities :Array<Activity>;
  table : string[][];
  tableau : string[][][] ;


  constructor(grade : string = "", group : string = '',
  activities :Array<Activity> = [],
  table : string[][]= [], tableau : string[][][] = []){
    this.grade = grade;
    this.group = group;
    this.activities = activities;
    this.table = table;
    this.tableau = tableau;
  }
}
