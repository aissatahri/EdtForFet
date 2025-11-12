import { Injectable } from '@angular/core';
import {Activity} from "./activities/activity";
import {ACTIVITIES} from "./activities/mock-activity-list";
import {InMemoryDbService} from "angular-in-memory-web-api";

@Injectable({
  providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService{

  constructor() { }


  createDb(){
    const activities: Activity[] = ACTIVITIES
    return {activities}
  }
}
