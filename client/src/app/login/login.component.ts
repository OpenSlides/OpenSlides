import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { BaseComponent } from '../base.component';
import { User } from '../users/user';
import { AuthenticationService } from '../_services/authentication.service';
import { AlertService } from '../_services/alert.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent extends BaseComponent implements OnInit {
  user: User = {
    username: '',
    password: ''
  };
  info: string;

  constructor(
    titleService: Title,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    private router: Router,
  ) {
    super(titleService);
    this.setInfo();
  }

  ngOnInit() {
    //TODO translate
    super.setTitle("Anmelden");
  }

  setInfo() {
    this.info = 'Logged in? ' + (this.authenticationService.isLoggedIn ? 'in' : 'out');
  }

  //Todo: This serves as a prototype and need enhancement,
  //like saving a "logged in state" and real checking the server
  //if logIn was fine
  onSubmit() {
    this.authenticationService.loginUser(this.user).subscribe(
      res => {
        if (res.status === 400) {
          //TODO, add more errors here, use translation
          this.alertService.error("Benutzername oder Passwort war nicht korrekt.");
        } else {
          this.alertService.success("Logged in! :)");
          this.setInfo();
          if (this.authenticationService.isLoggedIn) {
            localStorage.setItem("username", res.user.username);

            // Get the redirect URL from our auth service
            // If no redirect has been set, use the default
            let redirect = this.authenticationService.redirectUrl ?
              this.authenticationService.redirectUrl : '/';

            // Redirect the user
            this.router.navigate([redirect]);
          }
        }
      }
    );
  }
}
