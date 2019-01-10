import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { ViewUser } from '../../models/view-user';
import { UserRepositoryService } from '../../services/user-repository.service';
import { OperatorService } from '../../../../core/services/operator.service';
import { BaseViewComponent } from '../../../../site/base/base-view';

/**
 * Component for the Password-Reset Handling
 */
@Component({
    selector: 'os-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.scss']
})
export class PasswordComponent extends BaseViewComponent implements OnInit {
    /**
     * the user that is currently worked own
     */
    public user: ViewUser;

    /**
     * if this pw-page is for your own user
     */
    public ownPage: boolean;

    /**
     * user id from url parameter
     */
    public userId: number;

    /**
     * if current user has the "can_manage" permission
     */
    public canManage: boolean;

    /**
     * formGroup for the admin user
     */
    public adminPasswordForm: FormGroup;

    /**
     * formGroup for the normal user
     */
    public userPasswordForm: FormGroup;

    /**
     * if the new password in userform is hidden
     */
    public hide_user_password = true;

    /**
     * If the new Password in the adminform is hidden
     */
    public hide_admin_newPassword = true;

    /**
     * Constructor
     *
     * @param title the title
     * @param translate translation server
     * @param matSnackBar snack bar for errors
     * @param route current route
     * @param router router service
     * @param repo user repository
     * @param operator the operatorservice
     * @param formBuilder formbuilder for the two forms
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private repo: UserRepositoryService,
        private operator: OperatorService,
        private formBuilder: FormBuilder
    ) {
        super(title, translate, matSnackBar);
        this.route.params.subscribe(params => {
            if (params.id) {
                this.userId = params.id;
            }
        });
        if (this.userId === undefined) {
            this.operator.getObservable().subscribe(users => {
                if (users) {
                    this.userId = users.id;
                    this.router.navigate([`./users/password/${this.userId}`]);
                }
            });
        }
    }

    /**
     * Initializes the forms and some of the frontend options
     */
    public ngOnInit(): void {
        this.setViewUser(this.userId);
        this.setOpOwnsPage(this.userId);

        this.adminPasswordForm = this.formBuilder.group({
            admin_newPassword: ['', Validators.required]
        });

        this.userPasswordForm = this.formBuilder.group({
            user_newPassword1: ['', Validators.required],
            user_newPassword2: ['', Validators.required],
            user_oldPassword: ['', Validators.required]
        });
    }

    /**
     * Triggered by the "x" Button of the Form
     */
    public goBack(): void {
        if (!this.ownPage) {
            this.router.navigate([`./users/${this.user.id}`]);
        } else {
            this.router.navigate(['./']);
        }
    }

    /**
     * sets the current user that should be worked on
     *
     * @param userId user id from the route
     */
    private setViewUser(userId: number): void {
        this.repo.getViewModelObservable(userId).subscribe(newViewUser => {
            if (newViewUser) {
                this.user = newViewUser;
            }
        });
    }

    /**
     * sets the parameters if the pw-page is our own and if the current
     * user has the can_manage permission
     *
     * @param userId user id from the route
     */
    private setOpOwnsPage(userId: number): void {
        this.operator.getObservable().subscribe(users => {
            if (users) {
                this.ownPage = +userId === +users.id;
                this.canManage = this.operator.hasPerms('users.can_manage');
            }
        });
    }

    /**
     * Handles the whole save routine for every possible event
     */
    public async save(): Promise<void> {
        // can Manage, but not own Page (a.k.a. Admin)
        try {
            if (this.canManage && !this.ownPage) {
                const pw = this.adminPasswordForm.get('admin_newPassword').value;
                this.adminNewPassword(pw);
                this.router.navigate([`./users/${this.user.id}`]);
            }
            // can not Manage, but own Page (a.k.a. User)
            if (this.ownPage) {
                const oldPw = this.userPasswordForm.get('user_oldPassword').value;
                const newPw1 = this.userPasswordForm.get('user_newPassword1').value;
                const newPw2 = this.userPasswordForm.get('user_newPassword2').value;
                await this.userNewPassword(newPw1, newPw2, oldPw);
                this.router.navigate(['./']);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Sends new Password entered in the new password field to server
     *
     * @param password the password that should be set
     */
    private adminNewPassword(password: string): void {
        this.repo.resetPassword(this.user, password).catch(this.raiseError);
    }

    /**
     * sets the new password for a user and sends it to the server
     *
     * @param newPassword1 the new password
     * @param newPassword2 confirmation of the new password
     * @param oldPassword  the old password
     */
    private userNewPassword(newPassword1: string, newPassword2: string, oldPassword: string): void {
        if (newPassword1 !== newPassword2) {
            this.raiseError(this.translate.instant('Passwords do not match'));
        }
        this.repo.setNewPassword(oldPassword, newPassword1).catch(this.raiseError);
    }

    /**
     * clicking Shift and Enter will save automatically
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.save();
        }
    }

    /**
     * Takes generated password and puts it into admin PW field
     * and displays it
     */
    public admin_generatePassword(): void {
        this.adminPasswordForm.patchValue({
            admin_newPassword: this.repo.getRandomPassword()
        });
        this.admin_hidePassword(false);
    }

    /**
     * Takes generated password and puts it into user PW fields
     * and displays them
     */
    public user_generatePassword(): void {
        const newPW = this.repo.getRandomPassword();
        this.userPasswordForm.patchValue({
            user_newPassword1: newPW,
            user_newPassword2: newPW
        });
        this.user_hidePassword(false);
    }

    /**
     * Helper function to hide or display the pw in cleartext for admin form
     *
     * @param hide optional - states if it should be shown or not
     */
    public admin_hidePassword(hide?: boolean): void {
        if (hide !== null) {
            this.hide_admin_newPassword = hide;
        } else {
            this.hide_admin_newPassword = !this.hide_admin_newPassword;
        }
    }

    /**
     * Helper function to hide or display new pw in clearext for user form
     *
     * @param hide optional - states if it should be shown or not
     */
    public user_hidePassword(hide?: boolean): void {
        if (hide !== null) {
            this.hide_user_password = hide;
        } else {
            this.hide_user_password = !this.hide_user_password;
        }
    }
}
