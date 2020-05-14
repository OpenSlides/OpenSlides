import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewUser } from '../../models/view-user';

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
     * if all password inputs is hidden
     */
    public hidePassword = true;

    /**
     * if the old password should be shown
     */
    public hideOldPassword = true;

    private urlUserId: number | null;

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
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private repo: UserRepositoryService,
        private operator: OperatorService,
        private formBuilder: FormBuilder
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Initializes the forms and some of the frontend options
     */
    public ngOnInit(): void {
        super.setTitle(this.translate.instant('Change password'));
        this.route.params.subscribe(params => {
            if (params.id) {
                this.urlUserId = +params.id;
                this.repo.getViewModelObservable(this.urlUserId).subscribe(() => {
                    this.updateUser();
                });
            }
            this.updateUser();
        });

        this.operator.getUserObservable().subscribe(() => {
            this.updateUser();
        });

        this.adminPasswordForm = this.formBuilder.group({
            newPassword: ['', Validators.required]
        });

        this.userPasswordForm = this.formBuilder.group({
            newPassword1: ['', Validators.required],
            newPassword2: ['', Validators.required],
            oldPassword: ['', Validators.required]
        });
    }

    private updateUser(): void {
        const operator = this.operator.user;
        this.ownPage = this.urlUserId ? operator.id === this.urlUserId : true;
        if (this.ownPage) {
            this.user = this.operator.viewUser;
        } else {
            this.user = this.repo.getViewModel(this.urlUserId);
        }
        this.canManage = this.operator.hasPerms(Permission.usersCanManage);
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
     * Handles the whole save routine for every possible event
     */
    public async save(): Promise<void> {
        // can Manage, but not own Page (a.k.a. Admin)
        try {
            if (this.canManage && !this.ownPage) {
                if (!this.adminPasswordForm.valid) {
                    return;
                }
                const password = this.adminPasswordForm.value.newPassword;
                await this.repo.resetPassword(this.user, password);
                this.router.navigate([`./users/${this.user.id}`]);
            } else if (this.ownPage) {
                if (!this.userPasswordForm.valid) {
                    return;
                }
                const oldPassword = this.userPasswordForm.value.oldPassword;
                const newPassword1 = this.userPasswordForm.value.newPassword1;
                const newPassword2 = this.userPasswordForm.value.newPassword2;

                if (newPassword1 !== newPassword2) {
                    this.raiseError(this.translate.instant('Error: The new passwords do not match.'));
                } else {
                    await this.repo.setNewPassword(oldPassword, newPassword1);
                    this.router.navigate(['./']);
                }
            }
        } catch (e) {
            this.raiseError(e);
        }
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
    public generatePassword(): void {
        const randomPassword = this.repo.getRandomPassword();
        this.adminPasswordForm.patchValue({
            newPassword: randomPassword
        });
        this.userPasswordForm.patchValue({
            newPassword1: randomPassword,
            newPassword2: randomPassword
        });
        this.hidePassword = false;
    }
}
