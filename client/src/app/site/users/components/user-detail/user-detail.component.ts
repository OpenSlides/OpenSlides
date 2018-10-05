import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { ViewUser } from '../../models/view-user';
import { UserRepositoryService } from '../../services/user-repository.service';
import { Group } from '../../../../shared/models/users/group';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { OperatorService } from '../../../../core/services/operator.service';

/**
 * Users detail component for both new and existing users
 */
@Component({
    selector: 'os-user-detail',
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
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
     * Should contain all Groups, loaded or observed from DataStore
     */
    public groups: Group[];

    /**
     * Constructor for user
     */
    public constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private repo: UserRepositoryService,
        private DS: DataStoreService,
        private op: OperatorService
    ) {
        this.user = new ViewUser();
        if (route.snapshot.url[0] && route.snapshot.url[0].path === 'new') {
            this.newUser = true;
            this.setEditMode(true);
        } else {
            this.route.params.subscribe(params => {
                this.loadViewUser(params.id);

                // will fail after reload - observable required
                this.ownPage = this.opOwnsPage(Number(params.id));

                // observe operator to find out if we see our own page or not
                this.op.getObservable().subscribe(newOp => {
                    if (newOp) {
                        this.ownPage = this.opOwnsPage(Number(params.id));
                    }
                });
            });
        }
        this.createForm();
    }

    /**
     * sets the ownPage variable if the operator owns the page
     */
    public opOwnsPage(userId: number): boolean {
        return this.op.user && this.op.user.id === userId;
    }

    /**
     * Should determine if the user (Operator) has the
     * correct permission to perform the given action.
     *
     * actions might be:
     * - seeName        (title, 1st, last) (user.can_see_name or ownPage)
     * - seeExtra       (checkboxes, comment) (user.can_see_extra_data)
     * - seePersonal    (mail, username, about) (user.can_see_extra_data or ownPage)
     * - manage         (everything) (user.can_manage)
     * - changePersonal (mail, username, about) (user.can_manage or ownPage)
     *
     * @param action the action the user tries to perform
     */
    public isAllowed(action: string): boolean {
        switch (action) {
            case 'manage':
                return this.op.hasPerms('users.can_manage');
            case 'seeName':
                return this.op.hasPerms('users.can_see_name', 'users.can_manage') || this.ownPage;
            case 'seeExtra':
                return this.op.hasPerms('users.can_see_extra_data', 'users.can_manage');
            case 'seePersonal':
                return this.op.hasPerms('users.can_see_extra_data', 'users.can_manage') || this.ownPage;
            case 'changePersonal':
                return this.op.hasPerms('user.cans_manage') || this.ownPage;
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
        this.personalInfoForm = this.formBuilder.group({
            username: [''],
            title: [''],
            first_name: [''],
            last_name: [''],
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
        });

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
     * Generates a password using 8 pseudo-random letters
     * from the `characters` const.
     */
    public generatePassword(): void {
        let pw = '';
        const characters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const amount = 8;
        for (let i = 0; i < amount; i++) {
            pw += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.personalInfoForm.patchValue({
            default_password: pw
        });
    }

    /**
     * Save / Submit a user
     */
    public saveUser(): void {
        if (this.newUser) {
            this.repo.create(this.personalInfoForm.value).subscribe(
                response => {
                    this.newUser = false;
                    this.router.navigate([`./users/${response.id}`]);
                },
                error => console.error('Creation of the user failed: ', error.error)
            );
        } else {
            this.repo.update(this.personalInfoForm.value, this.user).subscribe(
                response => {
                    this.setEditMode(false);
                    this.loadViewUser(response.id);
                },
                error => console.error('Update of the user failed: ', error.error)
            );
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
    public deleteUserButton(): void {
        this.repo.delete(this.user).subscribe(response => {
            this.router.navigate(['./users/']);
        });
    }

    /**
     * Init function.
     */
    public ngOnInit(): void {
        this.makeFormEditable(this.editUser);
        this.groups = this.DS.filter(Group, group => group.id !== 1);
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof Group && model.id !== 1) {
                this.groups.push(model as Group);
            }
        });
    }
}
