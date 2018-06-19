import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { BaseComponent } from 'app/base.component';
import { User } from 'app/core/models/user';
import { AuthService } from 'app/core/services/auth.service';
import { AlertService } from 'app/core/services/alert.service';

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
        private authService: AuthService,
        private alertService: AlertService,
        private router: Router
    ) {
        super(titleService);
        this.setInfo();
    }

    ngOnInit() {
        //TODO translate
        super.setTitle('Anmelden');
    }

    setInfo() {
        this.info = 'Logged in? ' + (this.authService.isLoggedIn ? 'in' : 'out');
    }

    //Todo: This serves as a prototype and need enhancement,
    //like saving a "logged in state" and real checking the server
    //if logIn was fine
    onSubmit() {
        this.authService.login(this.user).subscribe(res => {
            if (res.status === 400) {
                //TODO, add more errors here, use
                console.log('error in login');

                //todo alert seems to work differently than toast
                this.alertService.error('Benutzername oder Passwort war nicht korrekt.');
            } else {
                this.alertService.success('Logged in! :)');
                this.setInfo();
                if (this.authService.isLoggedIn) {
                    localStorage.setItem('username', res.user.username);

                    // Get the redirect URL from our auth service
                    // If no redirect has been set, use the default
                    const redirect = this.authService.redirectUrl ? this.authService.redirectUrl : '/';

                    // Redirect the user
                    this.router.navigate([redirect]);
                }
            }
        });
    }
}
