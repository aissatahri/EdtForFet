import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {catchError, Observable, of, tap} from "rxjs";
import {Activity} from "./activity";

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private activitiesUrl = 'api/activities';
  constructor(
    private http :HttpClient
  ) { }
  getActivityList(): Observable<Activity[]> {
    return  this.http.get<Activity[]>(this.activitiesUrl).pipe(
      tap((response : Activity[]) => this.log(response)),
      catchError((error)=>this.handleError(error, []))

    );
  }
  getActivitiesByProfessorName(professorName: string): Observable<Activity[]> {
    // Utilisation de HttpParams pour passer le nom du professeur comme paramètre de requête
    const params = new HttpParams().set('professorName', professorName);
    return this.http.get<Activity[]>(this.activitiesUrl, { params }).pipe(
      tap((response : Activity[]) => this.log(response)),
      catchError((error)=>this.handleError(error, [])));
  }




  private log(response : any){
    return console.table(response[0])
  }
  private handleError(error : Error, errorValue : any){
    console.error(error)
    return of(errorValue)
  }
}
