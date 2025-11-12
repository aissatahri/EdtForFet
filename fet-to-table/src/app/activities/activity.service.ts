import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, Observable, of, tap} from "rxjs";
import {Activity} from "./activity";

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(
    private http :HttpClient
  ) { }

  getActivityList(): Observable<Activity[]> {
    return  this.http.get<Activity[]>('api/activities').pipe(
      tap((response : Activity[]) => this.log(response)),
      catchError((error)=>this.handleError(error, []))

    );
  }

  private log(response : any){
    return console.table(response)
  }
  private handleError(error : Error, errorValue : any){
    console.error(error)
    return of(errorValue)
  }
}
