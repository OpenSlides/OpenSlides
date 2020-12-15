import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { genders } from 'app/shared/models/users/user';
import { OneOfValidator } from 'app/shared/validators/one-of-validator';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { PollService } from 'app/site/polls/services/poll.service';
import { UserPdfExportService } from '../../services/user-pdf-export.service';
import { ViewGroup } from '../../models/view-group';
import { ViewUser } from '../../models/view-user';

interface UserBackends {
    [name: string]: {
        disallowedUpdateKeys: string[];
    };
}

/**
 * Users detail component for both new and existing users
 */
@Component({
    selector: 'os-user-detail',
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent extends BaseViewComponentDirective implements OnInit {
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
    public readonly groups: BehaviorSubject<ViewGroup[]> = new BehaviorSubject<ViewGroup[]>([]);

    public readonly users: BehaviorSubject<ViewUser[]> = new BehaviorSubject<ViewUser[]>([]);

    /**
     * Hold the list of genders (sexes) publicly to dynamically iterate in the view
     */
    public genderList = genders;

    private userBackends: UserBackends | null = null;

    private isVoteWeightActive: boolean;

    public get showVoteWeight(): boolean {
        return this.pollService.isElectronicVotingEnabled && this.isVoteWeightActive;
    }

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
        private constantsService: ConstantsService,
        private pollService: PollService,
        configService: ConfigService
    ) {
        super(title, translate, matSnackBar);
        this.createForm();

        this.constantsService.get<UserBackends>('UserBackends').subscribe(backends => (this.userBackends = backends));
        configService
            .get<boolean>('users_activate_vote_weight')
            .subscribe(active => (this.isVoteWeightActive = active));

        this.groupRepo.getViewModelListObservableWithoutDefaultGroup().subscribe(this.groups);
        this.users = this.repo.getViewModelListBehaviorSubject();
    }

    /**
     * Init function.
     */
    public ngOnInit(): void {
        if (this.route.snapshot.url[0] && this.route.snapshot.url[0].path === 'new') {
            super.setTitle('New participant');
            this.newUser = true;
            this.setEditMode(true);
        } else {
            this.route.params.subscribe(params => {
                this.subscriptions.push(
                    this.repo.getViewModelObservable(+params.id).subscribe(user => {
                        // ensures edition cannot be interrupted by autoupdate
                        if (user && !this.editUser) {
                            const title = user.getTitle();
                            super.setTitle(title);
                            this.user = user;
                        }
                    })
                );

                // observe operator to find out if we see our own page or not
                this.subscriptions.push(
                    this.operator.getUserObservable().subscribe(() => {
                        this.ownPage = this.operator.user && this.operator.user.id === +params.id;
                    })
                );
            });
        }
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
                vote_weight: [],
                about_me: [''],
                groups_id: [''],
                vote_delegated_from_users_id: [''],
                vote_delegated_to_id: [''],
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
    }

    /**
     * Should determine if the user (Operator) has the
     * correct permission to perform the given action.
     *
     * actions might be:
     * - delete         (deleting the user) (users.can_manage and not ownPage)
     * - seeName        (title, first, last, gender, about) (user.can_see_name or ownPage)
     * - seeOtherUsers  (title, first, last, gender, about) (user.can_see_name)
     * - seeExtra       (email, comment, is_active, last_email_send) (user.can_see_extra_data)
     * - seePersonal    (mail, username, structure level) (user.can_see_extra_data or ownPage)
     * - manage         (everything) (user.can_manage)
     * - changePersonal (mail, username, about) (user.can_manage or ownPage)
     * - changePassword (user.can_change_password)
     *
     * @param action the action the user tries to perform
     */
    public isAllowed(action: string): boolean {
        switch (action) {
            case 'delete':
                return this.operator.hasPerms(Permission.usersCanManage) && !this.ownPage;
            case 'manage':
                return this.operator.hasPerms(Permission.usersCanManage);
            case 'seeName':
                return this.operator.hasPerms(Permission.usersCanSeeName, Permission.usersCanManage) || this.ownPage;
            case 'seeOtherUsers':
                return this.operator.hasPerms(Permission.usersCanSeeName, Permission.usersCanManage);
            case 'seeExtra':
                return this.operator.hasPerms(Permission.usersCanSeeExtraData, Permission.usersCanManage);
            case 'seePersonal':
                return (
                    this.operator.hasPerms(Permission.usersCanSeeExtraData, Permission.usersCanManage) || this.ownPage
                );
            case 'changePersonal':
                return this.operator.hasPerms(Permission.usersCanManage) || this.ownPage;
            case 'changePassword':
                return (
                    (this.ownPage && this.operator.hasPerms(Permission.usersCanChangePassword)) ||
                    this.operator.hasPerms(Permission.usersCanManage)
                );
            default:
                return false;
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
     */
    public updateFormControlsAccesibility(): void {
        const formControlNames = Object.keys(this.personalInfoForm.controls);

        // Enable all controls.
        formControlNames.forEach(formControlName => {
            this.personalInfoForm.get(formControlName).enable();
        });

        // Disable not permitted controls
        if (!this.isAllowed('manage')) {
            formControlNames.forEach(formControlName => {
                if (!['username', 'email', 'about_me'].includes(formControlName)) {
                    this.personalInfoForm.get(formControlName).disable();
                }
            });
        }

        if (!this.newUser && this.user.auth_type && this.userBackends && this.userBackends[this.user.auth_type]) {
            this.userBackends[this.user.auth_type].disallowedUpdateKeys.forEach(key => {
                this.personalInfoForm.get(key).disable();
            });
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
                await this.repo.create(this.personalInfoForm.value);
                this.router.navigate([`./users/`]);
            } else {
                await this.repo.update(this.personalInfoForm.value, this.user);
                this.setEditMode(false);
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
        this.updateFormControlsAccesibility();

        if (!this.newUser && edit) {
            this.patchFormValues();
        }

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
     * (Re)- send an invitation email for this user after confirmation
     */
    public async sendInvitationEmail(): Promise<void> {
        const title = this.translate.instant('Sending an invitation email');
        const content = this.translate.instant('Are you sure you want to send an invitation email to the user?');
        if (await this.promptService.open(title, content)) {
            this.repo.bulkSendInvitationEmail([this.user]).then(this.raiseError, this.raiseError);
        }
    }

    /**
     * Fetches a localized string for the time the last email was sent.
     *
     * @returns a translated string with either the localized date/time; of 'No email sent'
     */
    public getEmailSentTime(): string {
        if (!this.user.isLastEmailSend) {
            return this.translate.instant('No email sent');
        }
        return this.repo.lastSentEmailTimeString(this.user);
    }
}
