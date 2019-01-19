import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { MatTableDataSource, MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ViewGroup } from '../../models/view-group';
import { Group } from 'app/shared/models/users/group';
import { BaseViewComponent } from '../../../base/base-view';
import { PromptService } from 'app/core/ui-services/prompt.service';

/**
 * Component for the Group-List and permission matrix
 */
@Component({
    selector: 'os-group-list',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent extends BaseViewComponent implements OnInit {
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
     * @param matSnackBar
     * @param repo
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        public repo: GroupRepositoryService,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Set, if the view is in edit mode. If editMod eis false, the editing is canceled.
     * @param editMode
     * @param newGroup Set to true, if the edit mode is for creating instead of updating a group.
     */
    public setEditMode(editMode: boolean, newGroup: boolean = true): void {
        this.editGroup = editMode;
        this.newGroup = newGroup;

        if (!editMode) {
            this.cancelEditing();
        }
    }

    /**
     * Creates or updates a group.
     */
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
     */
    public submitNewGroup(): void {
        if (!this.groupForm.value || !this.groupForm.valid) {
            return;
        }
        this.repo.create(this.groupForm.value).then(() => {
            this.groupForm.reset();
            this.cancelEditing();
        }, this.raiseError);
    }

    /**
     * Saves an edited group.
     */
    public submitEditedGroup(): void {
        if (!this.groupForm.value || !this.groupForm.valid) {
            return;
        }
        const updateData = new Group({ name: this.groupForm.value.name });

        this.repo.update(updateData, this.selectedGroup).then(() => {
            this.cancelEditing();
        }, this.raiseError);
    }

    /**
     * Deletes the selected Group
     */
    public async deleteSelectedGroup(): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${this.selectedGroup.name}?`;
        if (await this.promptService.open(this.translate.instant('Are you sure?'), content)) {
            this.repo.delete(this.selectedGroup).then(() => this.cancelEditing(), this.raiseError);
        }
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
     * @param viewGroup
     * @param perm
     */
    public togglePerm(viewGroup: ViewGroup, perm: string): void {
        const updateData = new Group({ permissions: viewGroup.getAlteredPermissions(perm) });
        this.repo.update(updateData, viewGroup).then(null, this.raiseError);
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
        if (event.key === 'Escape') {
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
