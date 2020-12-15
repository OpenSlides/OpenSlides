import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';
import { BehaviorSubject } from 'rxjs';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ChoiceService } from 'app/core/ui-services/choice.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { CsvExportService } from 'app/core/ui-services/csv-export.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { genders } from 'app/shared/models/users/user';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { PollService } from 'app/site/polls/services/poll.service';
import { UserFilterListService } from '../../services/user-filter-list.service';
import { UserPdfExportService } from '../../services/user-pdf-export.service';
import { UserSortListService } from '../../services/user-sort-list.service';
import { ViewGroup } from '../../models/view-group';
import { ViewUser } from '../../models/view-user';

/**
 * Interface for the short editing dialog.
 * Describe, which values the dialog has.
 */
interface InfoDialog {
    /**
     * The name of the user.
     */
    name: string;

    /**
     * Define all the groups the user is in.
     */
    groups_id: number[];

    /**
     * The gender of the user.
     */
    gender: string;

    /**
     * The participant number of the user.
     */
    number: string;

    /**
     * Structure level for one user.
     */
    structure_level: string;

    /**
     * Transfer voting rights from
     */
    vote_delegated_from_users_id: number[];

    /**
     * Transfer voting rights to
     */
    vote_delegated_to_id: number;
}

/**
 * Component for the user list view.
 */
@Component({
    selector: 'os-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent extends BaseListViewComponent<ViewUser> implements OnInit {
    /**
     * The reference to the template.
     */
    @ViewChild('userInfoDialog', { static: true })
    private userInfoDialog: TemplateRef<string>;

    /**
     * Declares the dialog for editing.
     */
    public infoDialog: InfoDialog;

    /**
     * All available groups, where the user can be in.
     */
    public groups: ViewGroup[];

    public readonly users: BehaviorSubject<ViewUser[]> = new BehaviorSubject<ViewUser[]>([]);

    /**
     * The list of all genders.
     */
    public genderList = genders;

    /**
     * Stores the observed configuration if the presence view is available to administrators
     */
    private _presenceViewConfigured = false;

    /**
     * @returns true if the presence view is available to administrators
     */
    public get presenceViewConfigured(): boolean {
        return this._presenceViewConfigured && this.operator.hasPerms(Permission.usersCanManage);
    }

    private isVoteWeightActive: boolean;

    /**
     * Helper to check for main button permissions
     *
     * @returns true if the user should be able to create users
     */
    public get canAddUser(): boolean {
        return this.operator.hasPerms(Permission.usersCanManage);
    }

    public get canSeeExtra(): boolean {
        return this.operator.hasPerms(Permission.usersCanSeeExtraData);
    }

    public get showVoteWeight(): boolean {
        return this.pollService.isElectronicVotingEnabled && this.isVoteWeightActive;
    }

    public get totalVoteWeight(): number {
        const votes = this.dataSource?.filteredData?.reduce((previous, current) => previous + current.vote_weight, 0);
        return votes ?? 0;
    }

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'short_name',
            width: 'auto'
        },
        {
            prop: 'group',
            width: '15%'
        },
        {
            prop: 'infos',
            width: this.singleButtonWidth
        },
        {
            prop: 'presence',
            width: '100px'
        }
    ];

    /**
     * Define extra filter properties
     */
    public filterProps = ['full_name', 'groups', 'structure_level', 'number', 'delegationName'];

    private selfPresentConfStr = 'users_allow_self_set_present';

    private allowSelfSetPresent: boolean;

    /**
     * The usual constructor for components
     * @param titleService Serivce for setting the title
     * @param translate Service for translation handling
     * @param matSnackBar Helper to diplay errors
     * @param repo the user repository
     * @param groupRepo: The user group repository
     * @param router the router service
     * @param route the local route
     * @param operator
     * @param csvExport CSV export Service,
     * @param promptService
     * @param groupRepo
     * @param filterService
     * @param sortService
     * @param config ConfigService
     * @param userPdf Service for downloading pdf
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        storage: StorageService,
        public repo: UserRepositoryService,
        private groupRepo: GroupRepositoryService,
        private choiceService: ChoiceService,
        private router: Router,
        public operator: OperatorService,
        protected csvExport: CsvExportService,
        private promptService: PromptService,
        public filterService: UserFilterListService,
        public sortService: UserSortListService,
        config: ConfigService,
        private userPdf: UserPdfExportService,
        private dialog: MatDialog,
        private pollService: PollService
    ) {
        super(titleService, translate, matSnackBar, storage);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
        this.users = this.repo.getViewModelListBehaviorSubject();
        config.get<boolean>('users_enable_presence_view').subscribe(state => (this._presenceViewConfigured = state));
        config.get<boolean>('users_activate_vote_weight').subscribe(active => (this.isVoteWeightActive = active));
        config.get<boolean>(this.selfPresentConfStr).subscribe(allowed => (this.allowSelfSetPresent = allowed));
    }

    /**
     * Init function
     *
     * sets the title, inits the table, sets sorting and filter options, subscribes
     * to filter/sort services
     */
    public ngOnInit(): void {
        super.setTitle('Participants');

        // Initialize the groups
        this.groups = this.groupRepo.getViewModelList().filter(group => group.id !== 1);

        this.subscriptions.push(
            this.groupRepo
                .getViewModelListObservable()
                .subscribe(groups => (this.groups = groups.filter(group => group.id !== 1)))
        );
    }

    /**
     * Handles the click on the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
    }

    public isPresentToggleDisabled(user: ViewUser): boolean {
        if (this.isMultiSelect) {
            return true;
        } else if (this.allowSelfSetPresent && this.operator.viewUser === user) {
            return false;
        } else {
            return !this.operator.hasPerms(Permission.usersCanManage);
        }
    }

    /**
     * This function opens the dialog,
     * where the user can quick change the groups,
     * the gender and the participant number.
     *
     * @param user is an instance of ViewUser. This is the given user, who will be modified.
     */
    public openEditInfo(user: ViewUser, ev: MouseEvent): void {
        if (this.isMultiSelect || !this.operator.hasPerms(Permission.usersCanManage)) {
            return;
        }
        ev.stopPropagation();
        this.infoDialog = {
            name: user.username,
            groups_id: user.groups_id,
            gender: user.gender,
            structure_level: user.structure_level,
            number: user.number,
            vote_delegated_from_users_id: user.vote_delegated_from_users_id,
            vote_delegated_to_id: user.vote_delegated_to_id
        };

        const dialogRef = this.dialog.open(this.userInfoDialog, infoDialogSettings);

        dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
            if (event.key === 'Enter' && event.shiftKey) {
                dialogRef.close(this.infoDialog);
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.repo.update(result, user).catch(this.raiseError);
            }
        });
    }

    /**
     * Export all users currently matching the filter
     * as CSV (including personal information such as initial passwords)
     */
    public csvExportUserList(): void {
        this.csvExport.export(
            this.dataSource.filteredData,
            [
                { property: 'title' },
                { property: 'first_name', label: 'Given name' },
                { property: 'last_name', label: 'Surname' },
                { property: 'structure_level', label: 'Structure level' },
                { property: 'number', label: 'Participant number' },
                { label: 'groups', map: user => user.groups.map(group => group.name).join(',') },
                { property: 'comment' },
                { property: 'is_active', label: 'Is active' },
                { property: 'is_present', label: 'Is present' },
                { property: 'is_committee', label: 'Is a committee' },
                { property: 'default_password', label: 'Initial password' },
                { property: 'email' },
                { property: 'username' },
                { property: 'gender' },
                { property: 'vote_weight', label: 'Vote weight' }
            ],
            this.translate.instant('Participants') + '.csv'
        );
    }

    /**
     * Export all users currently matching the filter as PDF
     * (access information, including personal information such as initial passwords)
     */
    public onDownloadAccessPdf(): void {
        this.userPdf.exportMultipleUserAccessPDF(this.dataSource.filteredData);
    }

    /**
     * triggers the download of a simple participant list (no details on user name and passwords)
     * with all users currently matching the filter
     */
    public pdfExportUserList(): void {
        this.userPdf.exportUserList(this.dataSource.filteredData);
    }

    /**
     * Bulk deletes users. Needs multiSelect mode to fill selectedRows
     */
    public async deleteSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete all selected participants?');
        if (await this.promptService.open(title)) {
            this.repo.bulkDelete(this.selectedRows).catch(this.raiseError);
        }
    }

    /**
     * Opens a dialog and sets the group(s) for all selected users.
     * SelectedRows is only filled with data in multiSelect mode
     */
    public async setGroupSelected(): Promise<void> {
        const content = this.translate.instant(
            'This will add or remove the following groups for all selected participants:'
        );
        const choices = [_('add group(s)'), _('remove group(s)')];
        const selectedChoice = await this.choiceService.open(content, this.groupRepo.getViewModelList(), true, choices);
        if (selectedChoice) {
            const action = selectedChoice.action === choices[0] ? 'add' : 'remove';
            this.repo
                .bulkAlterGroups(this.selectedRows, action, selectedChoice.items as number[])
                .catch(this.raiseError);
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'active' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setStateSelected(field: 'is_active' | 'is_present' | 'is_committee'): Promise<void> {
        let options: [string, string];
        let verboseStateName: string;
        switch (field) {
            case 'is_active':
                options = [_('active'), _('inactive')];
                verboseStateName = 'active';
                break;
            case 'is_present':
                options = [_('present'), _('absent')];
                verboseStateName = 'present';
                break;
            case 'is_committee':
                options = [_('committee'), _('no committee')];
                verboseStateName = 'committee';
                break;
        }
        const content = this.translate.instant(`Set status for selected participants:`);

        const selectedChoice = await this.choiceService.open(content, null, false, options);
        if (selectedChoice) {
            const value = selectedChoice.action === options[0];
            this.repo.bulkSetState(this.selectedRows, field, value).catch(this.raiseError);
        }
    }

    /**
     * Handler for bulk sending e-mail invitations. Uses selectedRows defined via
     * multiSelect mode.
     */
    public async sendInvitationEmailSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to send emails to all selected participants?');
        const content = this.selectedRows.length + ' ' + this.translate.instant('emails');
        if (await this.promptService.open(title, content)) {
            this.repo.bulkSendInvitationEmail(this.selectedRows).catch(this.raiseError);
        }
    }

    /**
     * Get information about the last time an invitation email was sent to a user
     *
     * @param user
     * @returns a string representation about the last time an email was sent to a user
     */
    public getEmailSentTime(user: ViewUser): string {
        if (!user.isLastEmailSend) {
            return this.translate.instant('No email sent');
        }
        return this.repo.lastSentEmailTimeString(user);
    }

    /**
     * Handler for bulk resetting passwords to the default ones. Needs multiSelect mode.
     */
    public async resetPasswordsToDefaultSelected(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to reset all passwords to the default ones?');
        if (!(await this.promptService.open(title))) {
            return;
        }

        if (this.selectedRows.find(row => row.user.id === this.operator.user.id)) {
            this.raiseError(
                this.translate.instant(
                    'Note: Your own password was not changed. Please use the password change dialog instead.'
                )
            );
        }
        this.repo.bulkResetPasswordsToDefault(this.selectedRows).catch(this.raiseError);
    }

    /**
     * Handler for bulk generating new passwords. Needs multiSelect mode.
     */
    public async generateNewPasswordsPasswordsSelected(): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to generate new passwords for all selected participants?'
        );
        const content = this.translate.instant(
            'Note, that the default password will be changed to the new generated one.'
        );
        if (!(await this.promptService.open(title, content))) {
            return;
        }

        if (this.selectedRows.find(row => row.user.id === this.operator.user.id)) {
            this.raiseError(
                this.translate.instant(
                    'Note: Your own password was not changed. Please use the password change dialog instead.'
                )
            );
        }
        this.repo.bulkGenerateNewPasswords(this.selectedRows).catch(this.raiseError);
    }

    /**
     * Sets the user present
     *
     * @param viewUser the viewUser Object
     * @param event the mouse event (to prevent propagaton to row triggers)
     */
    public setPresent(viewUser: ViewUser): void {
        viewUser.user.is_present = !viewUser.user.is_present;

        if (this.operator.hasPerms(Permission.usersCanManage)) {
            this.repo.update(viewUser.user, viewUser).catch(this.raiseError);
        } else if (this.allowSelfSetPresent && this.operator.viewUser === viewUser) {
            this.operator.setPresence(viewUser.user.is_present).catch(this.raiseError);
        }
    }
}
