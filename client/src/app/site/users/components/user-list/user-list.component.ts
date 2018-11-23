import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { CsvExportService } from '../../../../core/services/csv-export.service';

import { ViewUser } from '../../models/view-user';
import { UserRepositoryService } from '../../services/user-repository.service';
import { ListViewBaseComponent } from '../../../base/list-view-base';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { Group } from '../../../../shared/models/users/group';
import { PromptService } from '../../../../core/services/prompt.service';

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
     * The usual constructor for components
     *
     * @param titleService Serivce for setting the title
     * @param translate Service for translation handling
     * @param matSnackBar Helper to diplay errors
     * @param repo the user repository
     * @param router the router service
     * @param route the local route
     * @param csvExport CSV export Service,
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: UserRepositoryService,
        private router: Router,
        private route: ActivatedRoute,
        protected csvExport: CsvExportService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);

        // enable multiSelect for this listView
        this.canMultiSelect = true;
    }

    /**
     * Init function
     *
     * sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        super.setTitle('Users');
        this.initTable();
        this.repo.getViewModelListObservable().subscribe(newUsers => {
            this.dataSource.data = newUsers;
            this.checkSelection();
        });
    }

    /**
     * Navigate to import page or do it inline
     *
     * TODO: implement importing of users
     */
    public import(): void {
        console.log('click on Import');
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
     * Export all users as CSV
     */
    public csvExportUserList(): void {
        this.csvExport.export(
            this.dataSource.data,
            [
                { property: 'title' },
                { property: 'first_name', label: 'Given name' },
                { property: 'last_name', label: 'Surname' },
                { property: 'structure_level', label: 'Structure level' },
                { property: 'participant_number', label: 'Participant number' },
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
     * Bulk deletes users. Needs multiSelect mode to fill selectedRows
     */
    public async deleteSelected(): Promise<void> {
        const content = this.translate.instant('This will delete all selected assignments.');
        if (await this.promptService.open('Are you sure?', content)) {
            for (const user of this.selectedRows) {
                await this.repo.delete(user);
            }
        }
    }

    /**
     * TODO: Not yet as expected
     * Bulk sets the group for users. TODO: Group is still not decided in the ui
     * @param group TODO: type may still change
     * @param unset toggle for adding or removing from the group
     */
    public async setGroupSelected(group: Partial<Group>, unset?: boolean): Promise<void> {
        this.selectedRows.forEach(vm => {
            const groups = vm.groupIds;
            const idx = groups.indexOf(group.id);
            if (unset && idx >= 0) {
                groups.slice(idx, 1);
            } else if (!unset && idx < 0) {
                groups.push(group.id);
            }
        });
    }

    /**
     * Handler for bulk resetting passwords. Needs multiSelect mode.
     * TODO: Not yet implemented (no service yet)
     */
    public async resetPasswordsSelected(): Promise<void> {
        // for (const user of this.selectedRows) {
        //     await this.resetPassword(user);
        // }
    }

    /**
     * Handler for bulk setting/unsetting the 'active' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setActiveSelected(active: boolean): Promise<void> {
        for (const user of this.selectedRows) {
            await this.repo.update({ is_active: active }, user);
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'is present' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setPresentSelected(present: boolean): Promise<void> {
        for (const user of this.selectedRows) {
            await this.repo.update({ is_present: present }, user);
        }
    }

    /**
     * Handler for bulk setting/unsetting the 'is committee' attribute.
     * Uses selectedRows defined via multiSelect mode.
     */
    public async setCommitteeSelected(is_committee: boolean): Promise<void> {
        for (const user of this.selectedRows) {
            await this.repo.update({ is_committee: is_committee }, user);
        }
    }

    /**
     * Handler for bulk sending e-mail invitations. Uses selectedRows defined via
     * multiSelect mode. TODO: Not yet implemented (no service)
     */
    public async sendInvitationSelected(): Promise<void> {
        // this.selectedRows.forEach(vm => {
        // TODO if !vm.emailSent {vm.sendInvitation}
        // });
    }

    public getColumnDefinition(): string[] {
        const columns = ['name', 'group', 'presence'];
        if (this.isMultiSelect) {
            return ['selector'].concat(columns);
        }
        return columns;
    }
}
