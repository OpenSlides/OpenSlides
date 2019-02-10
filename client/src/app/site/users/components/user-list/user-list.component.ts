import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { ChoiceService } from 'app/core/ui-services/choice.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { CsvExportService } from 'app/core/ui-services/csv-export.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { UserFilterListService } from '../../services/user-filter-list.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { UserPdfExportService } from '../../services/user-pdf-export.service';
import { UserSortListService } from '../../services/user-sort-list.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ViewUser } from '../../models/view-user';

/**
 * Component for the user list view.
 *
 */
@Component({
    selector: 'os-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent extends ListViewBaseComponent<ViewUser> implements OnInit {
    /**
     * Columns to display in table when desktop view is available
     */
    public displayedColumnsDesktop: string[] = ['name', 'group'];

    /**
     * Columns to display in table when mobile view is available
     */
    public displayedColumnsMobile = ['name'];

    /**
     * Stores the observed configuration if the presence view is available to administrators
     */
    private _presenceViewConfigured = false;

    /**
     * TODO: Does not check for user manage rights itself
     * @returns true if the presence view is available to administrators
     */
    public get presenceViewConfigured(): boolean {
        return this._presenceViewConfigured;
    }

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
     * @param vp
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
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: UserRepositoryService,
        private groupRepo: GroupRepositoryService,
        private choiceService: ChoiceService,
        private router: Router,
        private route: ActivatedRoute,
        private operator: OperatorService,
        private vp: ViewportService,
        protected csvExport: CsvExportService,
        private promptService: PromptService,
        public filterService: UserFilterListService,
        public sortService: UserSortListService,
        config: ConfigService,
        private userPdf: UserPdfExportService
    ) {
        super(titleService, translate, matSnackBar);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
        config.get<boolean>('users_enable_presence_view').subscribe(state => (this._presenceViewConfigured = state));
    }

    /**
     * Init function
     *
     * sets the title, inits the table, sets sorting and filter options, subscribes
     * to filter/sort services
     */
    public ngOnInit(): void {
        super.setTitle('Users');
        this.initTable();

        this.filterService.filter().subscribe(filteredData => {
            this.sortService.data = filteredData;
        });
        this.sortService.sort().subscribe(sortedData => {
            this.dataSource.data = sortedData;
            this.checkSelection();
        });
    }

    /**
     * Handles the click on a user row if not in multiSelect modus
     * @param row selected row
     */
    public singleSelectAction(row: ViewUser): void {
        this.router.navigate([`./${row.id}`], { relativeTo: this.route });
    }

    /**
     * Handles the click on the plus button
     */
    public onPlusButton(): void {
        this.router.navigate(['./new'], { relativeTo: this.route });
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
                { property: 'email' }
            ],
            this.translate.instant('Participants') + '.csv'
        );
    }

    /**
     * Export all users currently matching the filter as PDF
     * (access information, including personal information such as initial passwords)
     */
    public onDownloadAccessPdf(): void {
        this.userPdf.exportMultipleUserAccessPDF(this.dataSource.data);
    }

    /**
     * triggers the download of a simple participant list (no details on user name and passwords)
     * with all users currently matching the filter
     */
    public pdfExportUserList(): void {
        this.userPdf.exportUserList(this.dataSource.data);
    }

    /**
     * Bulk deletes users. Needs multiSelect mode to fill selectedRows
     */
    public async deleteSelected(): Promise<void> {
        const content = this.translate.instant('This will delete all selected users.');
        if (await this.promptService.open('Are you sure?', content)) {
            for (const user of this.selectedRows) {
                await this.repo.delete(user);
            }
        }
    }

    /**
     * Opens a dialog and sets the group(s) for all selected users.
     * SelectedRows is only filled with data in multiSelect mode
     */
    public async setGroupSelected(): Promise<void> {
        const content = this.translate.instant('This will add or remove the following groups for all selected users:');
        const choices = ['Add group(s)', 'Remove group(s)'];
        const selectedChoice = await this.choiceService.open(content, this.groupRepo.getViewModelList(), true, choices);
        if (selectedChoice) {
            for (const user of this.selectedRows) {
                const newGroups = [...user.groups_id];
                (selectedChoice.items as number[]).forEach(newChoice => {
                    const idx = newGroups.indexOf(newChoice);
                    if (idx < 0 && selectedChoice.action === choices[0]) {
                        newGroups.push(newChoice);
                    } else if (idx >= 0 && selectedChoice.action === choices[1]) {
                        newGroups.splice(idx, 1);
                    }
                });
                await this.repo.update({ groups_id: newGroups }, user);
            }
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'active' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setActiveSelected(): Promise<void> {
        const content = this.translate.instant('Set the active status for the selected users');
        const options = ['Active', 'Not active'];
        const selectedChoice = await this.choiceService.open(content, null, false, options);
        if (selectedChoice) {
            const active = selectedChoice.action === options[0];
            for (const user of this.selectedRows) {
                await this.repo.update({ is_active: active }, user);
            }
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'is present' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setPresentSelected(): Promise<void> {
        const content = this.translate.instant('Set the presence status for the selected users');
        const options = ['Present', 'Not present'];
        const selectedChoice = await this.choiceService.open(content, null, false, options);
        if (selectedChoice) {
            const present = selectedChoice.action === options[0];
            for (const user of this.selectedRows) {
                await this.repo.update({ is_present: present }, user);
            }
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'is committee' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setCommitteeSelected(): Promise<void> {
        const content = this.translate.instant('Sets/unsets the committee status for the selected users');
        const options = ['Is committee', 'Is not committee'];
        const selectedChoice = await this.choiceService.open(content, null, false, options);
        if (selectedChoice) {
            const committee = selectedChoice.action === options[0];
            for (const user of this.selectedRows) {
                await this.repo.update({ is_committee: committee }, user);
            }
        }
    }

    /**
     * Handler for bulk sending e-mail invitations. Uses selectedRows defined via
     * multiSelect mode.
     */
    public async sendInvitationEmailSelected(): Promise<void> {
        const content =
            this.translate.instant('Send invitation e-Mails to the selected users?') +
            ` (${this.selectedRows.length} E-Mails)`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.sendInvitationEmail(this.selectedRows).then(this.raiseError, this.raiseError);
        }
    }

    /**
     * Handler for bulk setting new passwords. Needs multiSelect mode.
     */
    public async resetPasswordsSelected(): Promise<void> {
        for (const user of this.selectedRows) {
            const password = this.repo.getRandomPassword();
            this.repo.resetPassword(user, password, true);
        }
    }

    /**
     * returns the column definition
     *
     * @returns column definition
     */
    public getColumnDefinition(): string[] {
        let columns = this.vp.isMobile ? this.displayedColumnsMobile : this.displayedColumnsDesktop;
        if (this.operator.hasPerms('core.can_manage_projector')) {
            columns = ['projector'].concat(columns);
        }
        if (this.operator.hasPerms('users.can_manage')) {
            columns = columns.concat(['presence']);
        }
        if (this.isMultiSelect) {
            columns = ['selector'].concat(columns);
        }
        return columns;
    }

    /**
     * Sets the user present
     *
     * @param viewUser the viewUser Object
     */
    public async setPresent(viewUser: ViewUser): Promise<void> {
        viewUser.user.is_present = !viewUser.user.is_present;
        await this.repo.update(viewUser.user, viewUser);
    }
}
