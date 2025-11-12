import {Activity} from "../activities/activity";

export class Professor{
  name : string;
  cin : string;
  activities :Array<Activity>;
  table : string[][];
  T : string [];


  constructor(name: string = "", cin: string = "", activities: Array<Activity> = [], table :string[][] = [], T:string[] = []) {
    this.name = name;
    this.cin = cin;
    this.activities = activities;
    this.table = table;
    this.T = T;
  }
}
