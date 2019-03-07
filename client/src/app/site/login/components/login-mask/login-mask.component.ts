import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { AuthService } from 'app/core/core-services/auth.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { environment } from 'environments/environment';
import { LoginDataService, LoginData } from 'app/core/ui-services/login-data.service';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { HttpService } from 'app/core/core-services/http.service';

interface LoginDataWithInfoText extends LoginData {
    info_text?: string;
}

/**
 * Login mask component.
 *
 * Handles user and guest login
 */
@Component({
    selector: 'os-login-mask',
    templateUrl: './login-mask.component.html',
    styleUrls: ['./login-mask.component.scss']
})
export class LoginMaskComponent extends BaseComponent implements OnInit, OnDestroy {
    /**
     * Show or hide password and change the indicator accordingly
     */
    public hide: boolean;

    /**
     * Reference to the SnackBarEntry for the installation notice send by the server.
     */
    public installationNotice: string;

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

    public operatorSubscription: Subscription | null;

    /**
     * Constructor for the login component
     *
     * @param authService Authenticating the user
     * @param operator The representation of the current user
     * @param router forward to start page
     * @param formBuilder To build the form and validate
     * @param httpService used to get information before the login
     * @param OpenSlides The Service for OpenSlides
     * @param loginDataService provide information about the legal notice and privacy policy
     */
    public constructor(
        protected translate: TranslateService,
        private authService: AuthService,
        private operator: OperatorService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private httpService: HttpService,
        private loginDataService: LoginDataService
    ) {
        super();
        this.createForm();
    }

    /**
     * Init.
     *
     * Set the title to "Log In"
     * Observes the operator, if a user was already logged in, recreate to user and skip the login
     */
    public ngOnInit(): void {
        // Get the login data. Save information to the login data service. If there is an
        // error, ignore it.
        // TODO: This has to be caught by the offline service
        this.httpService.get<LoginDataWithInfoText>(environment.urlPrefix + '/users/login/').then(
            response => {
                if (response.info_text) {
                    this.installationNotice = response.info_text;
                }
                this.loginDataService.setLoginData(response);
            },
            () => {}
        );

        // Maybe the operator changes and the user is logged in. If so, redirect him and boot OpenSlides.
        this.operatorSubscription = this.operator.getUserObservable().subscribe(user => {
            if (user) {
                this.clearOperatorSubscription();
                this.authService.redirectUser(user.id);
            }
        });
    }

    /**
     * Clear the subscription on destroy.
     */
    public ngOnDestroy(): void {
        this.clearOperatorSubscription();
    }

    /**
     * Clears the subscription to the operator.
     */
    private clearOperatorSubscription(): void {
        if (this.operatorSubscription) {
            this.operatorSubscription.unsubscribe();
            this.operatorSubscription = null;
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
    public async formLogin(): Promise<void> {
        this.loginErrorMsg = '';
        this.inProcess = true;
        try {
            await this.authService.login(this.loginForm.value.username, this.loginForm.value.password, () => {
                this.clearOperatorSubscription(); // We take control, not the subscription.
            });
        } catch (e) {
            this.loginForm.setErrors({
                notFound: true
            });
            this.loginErrorMsg = e;
        }
        this.inProcess = false;
    }

    /**
     * Go to the reset password view
     */
    public resetPassword(): void {
        this.router.navigate(['./reset-password'], { relativeTo: this.route });
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
        this.authService.guestLogin();
    }
}
