import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatTableDataSource } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { GroupRepositoryService } from '../../services/group-repository.service';
import { ViewGroup } from '../../models/view-group';
import { Group } from '../../../../shared/models/users/group';
import { BaseComponent } from '../../../../base.component';

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

    @ViewChild('groupForm')
    public groupForm: FormGroup;

    /**
     * Constructor
     *
     * @param titleService Title Service
     * @param translate Translations
     * @param DS The Data Store
     * @param constants Constants
     */
    public constructor(titleService: Title, translate: TranslateService, public repo: GroupRepositoryService) {
        super(titleService, translate);
    }

    public setEditMode(mode: boolean, newGroup: boolean = true): void {
        this.editGroup = mode;
        this.newGroup = newGroup;

        if (!mode) {
            this.cancelEditing();
        }
    }

    public saveGroup(): void {
        if (this.editGroup && this.newGroup) {
            this.submitNewGroup();
        } else if (this.editGroup && !this.newGroup) {
            this.submitEditedGroup();
        }
    }

    /**
     * Select group in head bar
     */
    public selectGroup(group: ViewGroup): void {
        this.selectedGroup = group;
        this.setEditMode(true, false);
        this.groupForm.setValue({ name: this.selectedGroup.name });
    }

    /**
     * Saves a newly created group.
     * @param form form data given by the group
     */
    public submitNewGroup(): void {
        if (this.groupForm.value && this.groupForm.valid) {
            this.repo.create(this.groupForm.value).subscribe(response => {
                if (response) {
                    this.groupForm.reset();
                    this.cancelEditing();
                }
            });
        }
    }

    /**
     * Saves an edited group.
     * @param form form data given by the group
     */
    public submitEditedGroup(): void {
        if (this.groupForm.value && this.groupForm.valid) {
            const updateData = new Group({ name: this.groupForm.value.name });

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
    public deleteSelectedGroup(): void {
        this.repo.delete(this.selectedGroup).subscribe(response => this.cancelEditing());
    }

    /**
     * Cancel the editing
     */
    public cancelEditing(): void {
        this.newGroup = false;
        this.editGroup = false;
        this.groupForm.reset();
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
     * Converts a permission string into MatTableDataSource
     * @param permissions
     */
    public getTableDataSource(permissions: string[]): MatTableDataSource<any> {
        const dataSource = new MatTableDataSource();
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
        this.groupForm = new FormGroup({ name: new FormControl('', Validators.required) });
        this.repo.getViewModelListObservable().subscribe(newViewGroups => {
            if (newViewGroups) {
                this.groups = newViewGroups;
                this.updateRowDef();
            }
        });
    }
}
