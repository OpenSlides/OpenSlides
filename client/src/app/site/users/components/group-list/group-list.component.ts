import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatTableDataSource } from '@angular/material';
import { FormGroup } from '@angular/forms';

import { GroupRepositoryService, AppPermission } from '../../services/group-repository.service';
import { ViewGroup } from '../../models/view-group';
import { Group } from '../../../../shared/models/users/group';
import { BaseComponent } from '../../../../base.component';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Component for the Group-List and permission matrix
 */
@Component({
    selector: 'os-group-list',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent extends BaseComponent implements OnInit {
    /**
     * Holds all Groups
     */
    public groups: ViewGroup[];

    /**
     * The header rows that the table should show
     */
    public headerRowDef: string[] = [];

    /**
     * Show or hide the new groups box
     */
    public newGroup = false;

    /**
     * Show or hide edit Group features
     */
    public editGroup = false;

    /**
     * Store the group to edit
     */
    public selectedGroup: ViewGroup;

    /**
     * Constructor
     *
     * @param titleService Title Service
     * @param translate Translations
     * @param DS The Data Store
     * @param constants Constants
     */
    public constructor(titleService: Title, translate: TranslateService, private repo: GroupRepositoryService) {
        super(titleService, translate);
    }

    /**
     * Trigger for the new Group button
     */
    public newGroupButton(): void {
        this.editGroup = false;
        this.newGroup = !this.newGroup;
    }

    /**
     * Saves a newly created group.
     * @param form form data given by the group
     */
    public submitNewGroup(form: FormGroup): void {
        if (form.value) {
            this.repo.create(form.value).subscribe(response => {
                if (response) {
                    form.reset();
                    // commenting the next line would allow to create multiple groups without reopening the form
                    this.newGroup = false;
                }
            });
        }
    }

    /**
     * Saves an edited group.
     * @param form form data given by the group
     */
    public submitEditedGroup(form: FormGroup): void {
        if (form.value) {
            const updateData = new Group({ name: form.value.name });

            this.repo.update(updateData, this.selectedGroup).subscribe(response => {
                if (response) {
                    this.cancelEditing();
                }
            });
        }
    }

    /**
     * Deletes the selected Group
     */
    public async deleteSelectedGroup(): Promise<void> {
        try {
            await this.repo.delete(this.selectedGroup);
            this.cancelEditing();
        } catch (e) {
            if (e instanceof HttpErrorResponse) {
                // Todo: Error handling
            }
        }
    }

    /**
     * Cancel the editing
     */
    public cancelEditing(): void {
        this.editGroup = false;
    }

    /**
     * Select group in head bar
     */
    public selectGroup(group: ViewGroup): void {
        this.newGroup = false;
        this.selectedGroup = group;
        this.editGroup = true;
    }

    /**
     * Triggers when a permission was toggled
     * @param group
     * @param perm
     */
    public togglePerm(viewGroup: ViewGroup, perm: string): void {
        const updateData = new Group({ permissions: viewGroup.getAlteredPermissions(perm) });
        this.repo.update(updateData, viewGroup).subscribe();
    }

    /**
     * Update the rowDefinition after Reloading or changes
     */
    public updateRowDef(): void {
        // reset the rowDef list first
        this.headerRowDef = ['perm'];
        this.groups.forEach(viewGroup => {
            this.headerRowDef.push('' + viewGroup.name);
        });
    }

    /**
     * Required to detect changes in *ngFor loops
     *
     * @param group Corresponding group that was changed
     */
    public trackGroupArray(group: ViewGroup): number {
        return group.id;
    }

    /**
     * Returns all app permissions.
     */
    public getAppPermissions(): AppPermission[] {
        return this.repo.appPermissions;
    }

    /**
     * Converts a permission string into MatTableDataSource
     * @param permissions
     */
    public getTableDataSource(permissions: string[]): MatTableDataSource<string> {
        const dataSource = new MatTableDataSource<string>();
        dataSource.data = permissions;
        return dataSource;
    }

    /**
     * Determine if a group is protected from deletion
     * @param group ViewGroup
     */
    public isProtected(group: ViewGroup): boolean {
        return group.id === 1 || group.id === 2;
    }

    /**
     * Clicking escape while in #newGroupForm should toggle newGroup.
     */
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.keyCode === 27) {
            this.newGroup = false;
        }
    }

    /**
     * Init function.
     *
     * Monitor the repository for changes and update the local groups array
     */
    public ngOnInit(): void {
        super.setTitle('Groups');
        this.repo.getViewModelListObservable().subscribe(newViewGroups => {
            if (newViewGroups) {
                this.groups = newViewGroups;
                this.updateRowDef();
            }
        });
    }
}
