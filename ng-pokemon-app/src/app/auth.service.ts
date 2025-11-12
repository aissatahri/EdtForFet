import { Injectable } from '@angular/core';
import {delay, Observable, of, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  isLoggedIn: boolean = false;
  redirectUrl: string;
  constructor() { }

  login(name : string, password : string) : Observable<boolean>{
    const isLOggedIn = (name == 'pikachu' && password == 'pikachu');
    return of(isLOggedIn).pipe(
      delay(1000),
      tap(isLOggedIn => this.isLoggedIn = isLOggedIn)
    );
  }

  logout(){
    this.isLoggedIn = false
  }
}
