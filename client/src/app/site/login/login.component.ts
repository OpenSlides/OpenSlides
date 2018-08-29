import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { BaseComponent } from 'app/base.component';
import { AuthService } from 'app/core/services/auth.service';
import { OperatorService } from 'app/core/services/operator.service';
import { ErrorStateMatcher, MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { OpenSlidesService } from '../../core/services/openslides.service';

/**
 * Custom error states. Might become part of the shared module later.
 */
export class ParentErrorStateMatcher implements ErrorStateMatcher {
    public isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
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
export class LoginComponent extends BaseComponent implements OnInit, OnDestroy {
    /**
     * Show or hide password and change the indicator accordingly
     */
    public hide: boolean;

    /**
     * Reference to the SnackBarEntry for the installation notice send by the server.
     */
    private installationNotice: MatSnackBarRef<SimpleSnackBar>;

    /**
     * Login Error Message if any
     */
    public loginErrorMsg = '';

    /**
     * Form group for the login form
     */
    public loginForm: FormGroup;

    /**
     * Custom Form validation
     */
    public parentErrorStateMatcher = new ParentErrorStateMatcher();

    /**
     * Show the Spinner if validation is in process
     */
    public inProcess = false;

    /**
     * Constructor for the login component
     *
     * @param titleService Setting the title
     * @param authService Authenticating the user
     * @param operator The representation of the current user
     * @param router forward to start page
     * @param formBuilder To build the form and validate
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private authService: AuthService,
        private operator: OperatorService,
        private router: Router,
        private formBuilder: FormBuilder,
        private http: HttpClient,
        private matSnackBar: MatSnackBar,
        private OpenSlides: OpenSlidesService
    ) {
        super(titleService, translate);
        this.createForm();
    }

    /**
     * Init.
     *
     * Set the title to "Log In"
     * Observes the operator, if a user was already logged in, recreate to user and skip the login
     */
    public ngOnInit(): void {
        super.setTitle('Login');

        this.http.get<any>(environment.urlPrefix + '/users/login/', {}).subscribe(response => {
            this.installationNotice = this.matSnackBar.open(response.info_text, this.translate.instant('OK'), {
                duration: 5000
            });
        });
    }

    public ngOnDestroy(): void {
        if (this.installationNotice) {
            this.installationNotice.dismiss();
        }
    }

    /**
     * Create the login Form
     */
    public createForm(): void {
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
    public formLogin(): void {
        this.loginErrorMsg = '';
        this.inProcess = true;
        this.authService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe(res => {
            this.inProcess = false;

            if (res instanceof HttpErrorResponse) {
                this.loginForm.setErrors({
                    notFound: true
                });
                this.loginErrorMsg = res.error.detail;
            } else {
                this.OpenSlides.afterLoginBootup(res.user_id);
                let redirect = this.OpenSlides.redirectUrl ? this.OpenSlides.redirectUrl : '/';
                if (redirect.includes('login')) {
                    redirect = '/';
                }
                this.router.navigate([redirect]);
            }
        });
    }

    /**
     * TODO, should open an edit view for the users password.
     */
    public resetPassword(): void {
        console.log('TODO');
    }

    /**
     * returns if the anonymous is enabled.
     */
    public areGuestsEnabled(): boolean {
        return this.operator.guestsEnabled;
    }

    /**
     * Guests (if enabled) can navigate directly to the main page.
     */
    public guestLogin(): void {
        this.router.navigate(['/']);
    }
}
