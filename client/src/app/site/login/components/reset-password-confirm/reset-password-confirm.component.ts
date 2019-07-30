import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';

import { HttpService } from 'app/core/core-services/http.service';
import { BaseComponent } from '../../../../base.component';

/**
 * Reset password component.
 *
 */
@Component({
    selector: 'os-reset-password-confirm',
    templateUrl: './reset-password-confirm.component.html',
    styleUrls: ['../../assets/reset-password-pages.scss']
})
export class ResetPasswordConfirmComponent extends BaseComponent implements OnInit {
    /**
     * THis form holds one control for the new password.
     */
    public newPasswordForm: FormGroup;

    /**
     * The user_id that should be provided in the queryparams.
     */
    private user_id: string;

    /**
     * The token that should be provided in the queryparams.
     */
    private token: string;

    /**
     * Constructur for the reset password confirm view. Initializes the form for the new password.
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private http: HttpService,
        formBuilder: FormBuilder,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private matSnackBar: MatSnackBar
    ) {
        super(titleService, translate);
        this.newPasswordForm = formBuilder.group({
            password: ['', [Validators.required]]
        });
    }

    /**
     * Sets the title of the page and gets the queryparams.
     */
    public ngOnInit(): void {
        super.setTitle('Reset password');
        this.activatedRoute.queryParams.subscribe(params => {
            if (!this.user_id && !this.token) {
                if (!params.user_id || !params.token) {
                    setTimeout(() => {
                        this.matSnackBar.open('');
                        this.matSnackBar.open(
                            this.translate.instant('The link is broken. Please contact your system administrator.'),
                            this.translate.instant('OK'),
                            {
                                duration: 0
                            }
                        );
                        this.router.navigate(['/login']);
                    });
                } else {
                    this.user_id = params.user_id;
                    this.token = params.token;
                }
            }
        });
    }

    /**
     * Submit the new password.
     */
    public async submitNewPassword(): Promise<void> {
        if (this.newPasswordForm.invalid) {
            return;
        }

        try {
            await this.http.post<void>(environment.urlPrefix + '/users/reset-password-confirm/', {
                user_id: this.user_id,
                token: this.token,
                password: this.newPasswordForm.get('password').value
            });
            // TODO: Does we get a response for displaying?
            this.matSnackBar.open(
                this.translate.instant('Your password was resetted successfully!'),
                this.translate.instant('OK'),
                {
                    duration: 0
                }
            );
            this.router.navigate(['/login']);
        } catch (e) {
            console.log('error', e);
        }
    }
}
