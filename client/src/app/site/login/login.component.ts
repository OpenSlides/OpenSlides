import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { BaseComponent } from 'app/base.component';
import { AuthService } from 'app/core/services/auth.service';
import { OperatorService } from 'app/core/services/operator.service';

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
        private operator: OperatorService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        super(titleService);
    }

    ngOnInit() {
        super.setTitle('Log In');

        // if there is stored login information, try to login directly.
        this.operator.getObservable().subscribe(user => {
            if (user && user.id) {
                this.router.navigate(['/']);
            }
        });
    }

    openSnackBar(message: string) {
        this.snackBar.open(message, 'OK', {
            duration: 2000
        });
    }

    // Todo: This serves as a prototype and need enhancement,
    // if logIn was fine
    // like saving a "logged in state" and real checking the server
    formLogin(): void {
        this.authService.login(this.username, this.password).subscribe(res => {
            if (res.status === 400) {
                //TODO translate
                this.openSnackBar(res.error.detail);
            } else {
                if (res.user_id) {
                    const redirect = this.authService.redirectUrl ? this.authService.redirectUrl : '/';
                    this.router.navigate([redirect]);
                }
            }
        });
    }
}
