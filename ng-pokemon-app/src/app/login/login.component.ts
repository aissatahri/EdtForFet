import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  message: string = 'Vous êtes déconnecté. (pikachu/pikachu)';
  name: string;
  password: string;
  auth : AuthService;

  constructor(
    private authService : AuthService,
    private router: Router) { }

  ngOnInit(): void {
    this.auth = this.authService
  }
  // Informe l'utilisateur sur son authentfication.
  setMessage() {
    if(this.authService.isLoggedIn){
      this.message = 'you are connected'
    }
    else{
        this.message = 'name or password is failed'
    }
  }

  // Connecte l'utilisateur auprès du Guard
  login() {
    this.message = 'Tentative de connexion en cours ...';
    this.authService.login(this.name, this.password).subscribe((isLoggedIn) => {
      this.setMessage();
      if(isLoggedIn){
        this.router.navigate(['/pokemons']);
      }
      else{
        this.password = '';
        this.router.navigate(['/login']);
      }

     });
  }

  // Déconnecte l'utilisateur
  logout() {
    this.authService.logout();
    this.setMessage();
  }

}
