import {Activity} from "../activities/activity";

export class Room{
  name : string;
  activities :Array<Activity>;
  table : string[][];


  constructor(name: string = "", activities: Array<Activity> = [], table: string[][] = []) {
    this.name = name;
    this.activities = activities;
    this.table = table;
  }
}
