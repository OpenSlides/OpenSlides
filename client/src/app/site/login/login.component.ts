import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { BaseComponent } from 'app/base.component';
import { AuthService } from 'app/core/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent extends BaseComponent implements OnInit {
    username = '';
    password = '';
    info: string;

    constructor(
        titleService: Title,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
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

    openSnackBar(message: string) {
        this.snackBar.open(message, 'OK', {
            duration: 2000
        });
    }

    //Todo: This serves as a prototype and need enhancement,
    //like saving a "logged in state" and real checking the server
    //if logIn was fine
    formLogin(): void {
        this.authService.login(this.username, this.password).subscribe(res => {
            if (res.status === 400) {
                //TODO translate
                console.log('res: ', res);
                this.openSnackBar(res.error.detail);
            } else {
                // this.toastService.success('Logged in! :)');
                this.setInfo();
                if (this.authService.isLoggedIn) {
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
