import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { User } from '../users/user';
import { AuthService } from '../core/auth.service';
import { AlertService } from '../site/alert.service';
import { TitleService } from '../core/title.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    user: User = {
        username: '',
        password: ''
    };

    constructor(
        private titleService: TitleService,
        private authService: AuthService,
        private alertService: AlertService,
        private router: Router,
    ) { }

    ngOnInit() {
        //TODO translate
        this.titleService.setTitle('Anmelden');
    }

    //Todo: This serves as a prototype and need enhancement,
    //like saving a "logged in state" and real checking the server
    //if logIn was fine
    onSubmit() {
        this.authService.loginUser(this.user).subscribe(
            res => {
                // TODO an error is thrown here. Also all this stuff should the the auth service..
                /*if (res.status === 400) {
                    // TODO Use the error that comes from the server
                    //this.alertService.error("Benutzername oder Passwort war nicht korrekt.");
                } else {
                    if (this.authService.isLoggedIn) {
                        // Get the redirect URL from our auth service
                        // If no redirect has been set, use the default
                        let redirect = this.authService.redirectUrl ?
                          this.authService.redirectUrl : '/';

                        // TODO check, if there is a redirect url. Else redirect to /

                        // Redirect the user
                        this.router.navigate([redirect]);
                    }
                }*/
            }
        );
    }
}
