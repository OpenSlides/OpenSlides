import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Permission } from 'app/core/core-services/operator.service';
import { AppPermissions, GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { Group } from 'app/shared/models/users/group';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewGroup } from '../../models/view-group';

/**
 * Component for the Group-List and permission matrix
 */
@Component({
    selector: 'os-group-list',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss']
})
export class GroupListComponent extends BaseViewComponentDirective implements OnInit {
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

    @ViewChild('groupForm', { static: true })
    public groupForm: FormGroup;

    /**
     * Reference to the template
     */
    @ViewChild('groupEditDialog', { static: true })
    public groupEditDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

    public get appPermissions(): AppPermissions[] {
        return this.repo.appPermissions;
    }

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
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private dialog: MatDialog,
        private repo: GroupRepositoryService,
        private promptService: PromptService,
        private fb: FormBuilder
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

        const name = this.selectedGroup ? this.translate.instant(this.selectedGroup.name) : '';

        this.groupForm = this.fb.group({
            name: [name, Validators.required]
        });

        this.dialogRef = this.dialog.open(this.groupEditDialog, infoDialogSettings);

        this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
            if (event.key === 'Enter' && event.shiftKey && this.groupForm.valid) {
                this.saveGroup(this.groupForm.value);
            }
        });
    }

    /**
     * Creates or updates a group.
     */
    public saveGroup(value: { name: string }): void {
        if (this.editGroup && this.newGroup) {
            this.repo.create(value as Group).then(() => this.cancelEditing(), this.raiseError);
        } else if (this.editGroup && !this.newGroup) {
            this.repo.update(value, this.selectedGroup).then(() => this.cancelEditing(), this.raiseError);
        }
    }

    /**
     * Select group in head bar
     */
    public selectGroup(group: ViewGroup): void {
        this.selectedGroup = group;
        this.setEditMode(true, false);
    }

    /**
     * Deletes the selected Group
     */
    public async deleteSelectedGroup(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this group?');
        const content = this.translate.instant(this.selectedGroup.name);
        if (await this.promptService.open(title, content)) {
            this.repo.delete(this.selectedGroup).then(() => this.cancelEditing(), this.raiseError);
        }
    }

    /**
     * Cancel the editing
     */
    public cancelEditing(): void {
        this.dialogRef.close();
        this.newGroup = false;
        this.editGroup = false;
        this.selectedGroup = null;
    }

    /**
     * Prevent deleting group 1 and 2 (default and admin)
     */
    public canDeleteGroup(group: ViewGroup): boolean {
        return group.id !== 1 && group.id !== 2;
    }

    /**
     * Triggers when a permission was toggled
     * @param viewGroup
     * @param perm
     */
    public togglePerm(viewGroup: ViewGroup, perm: Permission): void {
        this.repo.togglePerm(viewGroup, perm);
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
        this.repo.getViewModelListObservable().subscribe(newViewGroups => {
            if (newViewGroups) {
                this.groups = newViewGroups;
                this.updateRowDef();
            }
        });
    }
}
