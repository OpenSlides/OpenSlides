import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewUser } from '../../models/view-user';

/**
 * This component offers an input field for user numbers, and sets/unsets the
 * 'is_present' status for the user associated with that number, giving a feedback
 * by displaying the name and the new presence status of that user.
 *
 * The component is typically directly accessed via the router link
 */
@Component({
    selector: 'os-presence-detail',
    templateUrl: './presence-detail.component.html'
})
export class PresenceDetailComponent implements OnInit {
    /**
     * The form group for the input field
     */
    public userForm: FormGroup;

    /**
     * Contains the last user entered. Is null if there is no user or the last
     * participant number has no unique valid user
     */
    public lastChangedUser: ViewUser;

    /**
     * Subscription to update {@link lastChangedUser}
     */
    private _userSubscription: Subscription = null;
    public errorMsg: string;

    /**
     * Config variable if this view is enabled in the config
     * TODO: Should be a temporary check, until the permission on users-routing.module is fixed
     */
    private _enabledInConfig: boolean;

    /**
     * permission check if user is allowed to access this view.
     * TODO: Should be a temporary check, until the permission on users-routing.module is fixed
     *
     * @returns true if the user is allowed to use this view
     */
    public get permission(): boolean {
        return this.operator.hasPerms(Permission.usersCanManage) && this._enabledInConfig;
    }

    /**
     * Constructor. Subscribes to the configuration if this view should be enabled at all
     *
     * @param userRepo: UserRepositoryService for querying the users
     * @param formBuilder FormBuilder input form
     * @param operator OperatorService fetch the current user for a permission check
     * @param translate Translation service
     * @param config ConfigService checking if the feature is enabled
     */
    public constructor(
        private userRepo: UserRepositoryService,
        private formBuilder: FormBuilder,
        private operator: OperatorService,
        private translate: TranslateService,
        config: ConfigService
    ) {
        config.get<boolean>('users_enable_presence_view').subscribe(conf => (this._enabledInConfig = conf));
    }

    /**
     * initializes the form control
     */
    public ngOnInit(): void {
        this.userForm = this.formBuilder.group({
            number: ''
        });
    }

    /**
     * Triggers the user finding and updating process. The user number will be taken from the {@link userForm}.
     * Feedback will be relayed to the {@link errorMsg} and/or {@link lastChangedUser} variables
     */
    public async changePresence(): Promise<void> {
        const number = this.userForm.get('number').value;
        const users = this.userRepo.getUsersByNumber(number);
        this.userForm.reset();
        if (users.length === 1) {
            await this.userRepo.update({ is_present: !users[0].is_present }, users[0]);
            this.subscribeUser(users[0].id);
        } else if (!users.length) {
            this.clearSubscription();
            this.errorMsg = this.translate.instant('Participant cannot be found');
        } else if (users.length > 1) {
            this.clearSubscription();
            this.errorMsg = this.translate.instant('Participant number is not unique');
        }
    }

    /**
     * Subscribes this component to a user given by an id. The
     * {@link lastChangedUser} will be updated accordingly.
     *
     * @param id the id of the user to be shown as lastChangedUser
     */
    private subscribeUser(id: number): void {
        this.clearSubscription();
        this.errorMsg = null;
        this._userSubscription = this.userRepo
            .getViewModelObservable(id)
            .subscribe(user => (this.lastChangedUser = user));
    }

    /**
     * Clears the currently displayed user and subscription, if any is present
     */
    private clearSubscription(): void {
        if (this._userSubscription) {
            this._userSubscription.unsubscribe();
        }
        this.lastChangedUser = null;
    }

    /**
     * triggers the submission on enter key
     */
    public onKeyUp(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.changePresence();
        }
    }
}
