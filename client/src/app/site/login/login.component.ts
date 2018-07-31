import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { BaseComponent } from 'app/base.component';
import { AuthService } from 'app/core/services/auth.service';
import { OperatorService } from 'app/core/services/operator.service';
import { ErrorStateMatcher } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, FormGroup, Validators, FormBuilder } from '@angular/forms';

/**
 * Custom error states. Might become part of the shared module later.
 */
export class ParentErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = !!(form && form.submitted);
        const controlTouched = !!(control && (control.dirty || control.touched));
        const controlInvalid = !!(control && control.invalid);
        const parentInvalid = !!(
            control &&
            control.parent &&
            control.parent.invalid &&
            (control.parent.dirty || control.parent.touched)
        );

        return isSubmitted || (controlTouched && (controlInvalid || parentInvalid));
    }
}

/**
 * Login component.
 *
 * Handles user (and potentially guest) login
 */
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent extends BaseComponent implements OnInit {
    /**
     * Show or hide password and change the indicator accordingly
     */
    hide: boolean;

    /**
     * Login Error Message if any
     */
    loginErrorMsg = '';

    /**
     * Form group for the login form
     */
    loginForm: FormGroup;

    /**
     * Custom Form validation
     */
    parentErrorStateMatcher = new ParentErrorStateMatcher();

    /**
     * Show the Spinner if validation is in process
     */
    inProcess = false;

    /**
     *
     * @param titleService Setting the title
     * @param authService Authenticating the user
     * @param operator The representation of the current user
     * @param router forward to start page
     * @param formBuilder To build the form and validate
     */
    constructor(
        titleService: Title,
        private authService: AuthService,
        private operator: OperatorService,
        private router: Router,
        private formBuilder: FormBuilder
    ) {
        super(titleService);
        this.createForm();
    }

    /**
     * Init.
     *
     * Set the title to "Log In"
     * Observes the operator, if a user was already logged in, recreate to user and skip the login
     */
    ngOnInit() {
        super.setTitle('Log In');

        // if there is stored login information, try to login directly.
        this.operator.getObservable().subscribe(user => {
            if (user && user.id) {
                this.router.navigate(['/']);
            }
        });
    }

    /**
     * Create the login Form
     */
    createForm() {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.maxLength(128)]],
            password: ['', [Validators.required, Validators.maxLength(128)]]
        });
    }

    /**
     * Actual login function triggered by the form.
     *
     * Send username and password to the {@link AuthService}
     */
    formLogin(): void {
        this.loginErrorMsg = '';
        this.inProcess = true;
        this.authService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe(res => {
            if (res.status === 400) {
                this.inProcess = false;
                this.loginForm.setErrors({
                    notFound: true
                });
                this.loginErrorMsg = res.error.detail;
            } else {
                this.inProcess = false;
                if (res.user_id) {
                    const redirect = this.authService.redirectUrl ? this.authService.redirectUrl : '/';
                    this.router.navigate([redirect]);
                }
            }
        });
    }
}
