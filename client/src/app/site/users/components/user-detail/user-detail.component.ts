import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title, SafeHtml, DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { genders, User } from 'app/shared/models/users/user';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { UserPdfExportService } from '../../services/user-pdf-export.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ViewUser } from '../../models/view-user';
import { ViewGroup } from '../../models/view-group';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { OneOfValidator } from 'app/shared/validators/one-of-validator';

/**
 * Users detail component for both new and existing users
 */
@Component({
    selector: 'os-user-detail',
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * Info form object
     */
    public personalInfoForm: FormGroup;

    /**
     * if this is the own page
     */
    public ownPage = false;

    /**
     * Editing a user
     */
    public editUser = false;

    /**
     * Set new Password
     */
    public newPassword = false;

    /**
     * True if a new user is created
     */
    public newUser = false;

    /**
     * True if the operator has manage permissions
     */
    public canManage = false;

    /**
     * ViewUser model
     */
    public user: ViewUser;

    /**
     * Contains all groups, except for the default group.
     */
    public groups: ViewGroup[];

    /**
     * Hold the list of genders (sexes) publicly to dynamically iterate in the view
     */
    public genderList = genders;

    /**
     * Constructor for user
     *
     * @param title Title
     * @param translate TranslateService
     * @param matSnackBar MatSnackBar
     * @param formBuilder FormBuilder
     * @param route ActivatedRoute
     * @param router Router
     * @param repo UserRepositoryService
     * @param operator OperatorService
     * @param promptService PromptService
     * @param pdfService UserPdfExportService used for export to pdf
     * @param groupRepo
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private repo: UserRepositoryService,
        private operator: OperatorService,
        private promptService: PromptService,
        private pdfService: UserPdfExportService,
        private groupRepo: GroupRepositoryService,
        private sanitizer: DomSanitizer
    ) {
        super(title, translate, matSnackBar);
        // prevent 'undefined' to appear in the ui
        const defaultUser: any = {};
        // tslint:disable-next-line
        [
            'username',
            'title',
            'first_name',
            'last_name',
            'gender',
            'structure_level',
            'number',
            'about_me',
            'email',
            'comment',
            'default_password'
        ].forEach(property => {
            defaultUser[property] = '';
        });
        this.user = new ViewUser(new User(defaultUser));
        if (route.snapshot.url[0] && route.snapshot.url[0].path === 'new') {
            super.setTitle('New participant');
            this.newUser = true;
            this.setEditMode(true);
        } else {
            this.route.params.subscribe(params => {
                this.loadViewUser(params.id);

                // will fail after reload - observable required
                this.ownPage = this.opOwnsPage(Number(params.id));

                // observe operator to find out if we see our own page or not
                this.operator.getUserObservable().subscribe(newOp => {
                    if (newOp) {
                        this.ownPage = this.opOwnsPage(Number(params.id));
                    }
                });
            });
        }
        this.createForm();

        this.groups = this.groupRepo.getViewModelList().filter(group => group.id !== 1);
        this.groupRepo
            .getViewModelListObservable()
            .subscribe(groups => (this.groups = groups.filter(group => group.id !== 1)));
    }

    /**
     * Init function.
     */
    public ngOnInit(): void {
        this.makeFormEditable(this.editUser);
    }

    /**
     * Checks, if the given user id matches with the operator ones.
     *
     * @param userId The id to check, if it's the operator
     * @returns If the user is the operator
     */
    public opOwnsPage(userId: number): boolean {
        return this.operator.user && this.operator.user.id === userId;
    }

    /**
     * Should determine if the user (Operator) has the
     * correct permission to perform the given action.
     *
     * actions might be:
     * - delete         (deleting the user) (users.can_manage and not ownPage)
     * - seeName        (title, 1st, last) (user.can_see_name or ownPage)
     * - seeOtherUsers  (title, 1st, last) (user.can_see_name)
     * - seeExtra       (checkboxes, comment) (user.can_see_extra_data)
     * - seePersonal    (mail, username, about) (user.can_see_extra_data or ownPage)
     * - manage         (everything) (user.can_manage)
     * - changePersonal (mail, username, about) (user.can_manage or ownPage)
     * - changePassword (user.can_change_password)
     *
     * @param action the action the user tries to perform
     */
    public isAllowed(action: string): boolean {
        switch (action) {
            case 'delete':
                return this.operator.hasPerms('users.can_manage') && !this.ownPage;
            case 'manage':
                return this.operator.hasPerms('users.can_manage');
            case 'seeName':
                return this.operator.hasPerms('users.can_see_name', 'users.can_manage') || this.ownPage;
            case 'seeOtherUsers':
                return this.operator.hasPerms('users.can_see_name', 'users.can_manage');
            case 'seeExtra':
                return this.operator.hasPerms('users.can_see_extra_data', 'users.can_manage');
            case 'seePersonal':
                return this.operator.hasPerms('users.can_see_extra_data', 'users.can_manage') || this.ownPage;
            case 'changePersonal':
                return this.operator.hasPerms('users.can_manage') || this.ownPage;
            case 'changePassword':
                return (
                    (this.ownPage && this.operator.hasPerms('users.can_change_password')) ||
                    this.operator.hasPerms('users.can_manage')
                );
            default:
                return false;
        }
    }

    /**
     * Loads a user from users repository
     * @param id the required ID
     */
    public loadViewUser(id: number): void {
        this.repo.getViewModelObservable(id).subscribe(newViewUser => {
            // repo sometimes delivers undefined values
            // also ensures edition cannot be interrupted by autoupdate
            if (newViewUser && !this.editUser) {
                const title = newViewUser.getTitle();
                super.setTitle(title);
                this.user = newViewUser;
                // personalInfoForm is undefined during 'new' and directly after reloading
                if (this.personalInfoForm) {
                    this.patchFormValues();
                }
            }
        });
    }

    /**
     * initialize the form with default values
     */
    public createForm(): void {
        this.personalInfoForm = this.formBuilder.group(
            {
                username: [''],
                title: [''],
                first_name: [''],
                last_name: [''],
                gender: [''],
                structure_level: [''],
                number: [''],
                about_me: [''],
                groups_id: [''],
                is_present: [true],
                is_committee: [false],
                email: ['', Validators.email],
                last_email_send: [''],
                comment: [''],
                is_active: [true],
                default_password: ['']
            },
            {
                validators: OneOfValidator.validation('username', 'first_name', 'last_name')
            }
        );

        // patch the form only for existing users
        if (!this.newUser) {
            this.patchFormValues();
        }
    }

    /**
     * Loads values that require external references
     * And allows async reading
     */
    public patchFormValues(): void {
        const personalInfoPatch = {};
        Object.keys(this.personalInfoForm.controls).forEach(ctrl => {
            personalInfoPatch[ctrl] = this.user[ctrl];
        });
        this.personalInfoForm.patchValue(personalInfoPatch);
    }

    /**
     * Makes the form editable
     * @param editable
     */
    public makeFormEditable(editable: boolean): void {
        if (this.personalInfoForm) {
            const formControlNames = Object.keys(this.personalInfoForm.controls);
            const allowedFormFields = [];

            if (this.isAllowed('manage')) {
                // editable content with manage rights
                allowedFormFields.push(
                    this.personalInfoForm.get('username'),
                    this.personalInfoForm.get('title'),
                    this.personalInfoForm.get('first_name'),
                    this.personalInfoForm.get('last_name'),
                    this.personalInfoForm.get('email'),
                    this.personalInfoForm.get('gender'),
                    this.personalInfoForm.get('structure_level'),
                    this.personalInfoForm.get('number'),
                    this.personalInfoForm.get('groups_id'),
                    this.personalInfoForm.get('comment'),
                    this.personalInfoForm.get('is_present'),
                    this.personalInfoForm.get('is_active'),
                    this.personalInfoForm.get('is_committee'),
                    this.personalInfoForm.get('about_me')
                );
            } else if (this.isAllowed('changePersonal')) {
                // changeable personal data
                // FIXME: Own E-Mail and Password is hidden (server?)
                allowedFormFields.push(
                    this.personalInfoForm.get('username'),
                    this.personalInfoForm.get('email'),
                    this.personalInfoForm.get('gender'),
                    this.personalInfoForm.get('about_me')
                );
            }

            // treatment for the initial password field
            if (!editable || this.newUser) {
                allowedFormFields.push(this.personalInfoForm.get('default_password'));
            }

            if (editable) {
                allowedFormFields.forEach(formElement => {
                    formElement.enable();
                });
            } else {
                formControlNames.forEach(formControlName => {
                    this.personalInfoForm.get(formControlName).disable();
                });
            }
        }
    }

    /**
     * Handler for the generate Password button.
     */
    public generatePassword(): void {
        this.personalInfoForm.patchValue({
            default_password: this.repo.getRandomPassword()
        });
    }

    /**
     * clicking Shift and Enter will save automatically
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && event.shiftKey) {
            this.saveUser();
        }
    }

    /**
     * Save / Submit a user
     */
    public async saveUser(): Promise<void> {
        if (this.personalInfoForm.invalid) {
            let hint = '';
            if (this.personalInfoForm.errors) {
                hint = 'At least one of username, first name or last name has to be set.';
            } else {
                for (const formControl in this.personalInfoForm.controls) {
                    if (this.personalInfoForm.get(formControl).errors) {
                        hint = formControl + ' is incorrect.';
                    }
                }
            }
            this.raiseError(this.translate.instant(hint));
            return;
        }
        try {
            if (this.newUser) {
                await this.repo.create(this.personalInfoForm.value).then(() => {
                    this.newUser = false;
                    this.router.navigate([`./users/`]);
                }, this.raiseError);
            } else {
                // TODO (Issue #3962): We need a waiting-State, so if autoupdates come before the response,
                // the user is also updated.
                await this.repo.update(this.personalInfoForm.value, this.user);
                this.setEditMode(false);
                this.loadViewUser(this.user.id);
            }
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * sets editUser variable and editable form
     * @param edit
     */
    public setEditMode(edit: boolean): void {
        this.editUser = edit;
        this.makeFormEditable(edit);

        // case: abort creation of a new user
        if (this.newUser && !edit) {
            this.router.navigate(['./users/']);
        }
    }

    /**
     * click on the delete user button
     */
    public async deleteUserButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this participant?');
        const content = this.user.full_name;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(this.user).then(() => this.router.navigate(['./users/']), this.raiseError);
        }
    }

    /**
     * navigate to the change Password site
     */
    public changePassword(): void {
        this.router.navigate([`./users/password/${this.user.id}`]);
    }

    /**
     * Triggers the pdf download for this user
     */
    public onDownloadPdf(): void {
        this.pdfService.exportSingleUserAccessPDF(this.user);
    }

    /**
     * Function to sanitize the text.
     * Necessary to render text etc. correctly.
     *
     * @param text which should be sanitized.
     *
     * @returns safeHtml which can be displayed.
     */
    public sanitizedText(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    /**
     * (Re)- send an invitation email for this user after confirmation
     */
    public async sendInvitationEmail(): Promise<void> {
        const title = this.translate.instant('Sending an invitation email');
        const content = this.translate.instant('Are you sure you want to send an invitation email to the user?');
        if (await this.promptService.open(title, content)) {
            this.repo.sendInvitationEmail([this.user]).then(this.raiseError, this.raiseError);
        }
    }

    /**
     * Fetches a localized string for the time the last email was sent.
     *
     * @returns a translated string with either the localized date/time; of 'No email sent'
     */
    public getEmailSentTime(): string {
        if (!this.user.is_last_email_send) {
            return this.translate.instant('No email sent');
        }
        return this.repo.lastSentEmailTimeString(this.user);
    }
}
