import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { ViewCategory } from 'app/site/motions/models/view-category';

/**
 * Table for categories
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseListViewComponent<ViewCategory> implements OnInit {
    @ViewChild('newCategoryDialog', { static: true })
    private newCategoryDialog: TemplateRef<string>;

    private dialogRef: MatDialogRef<any>;

    /**
     * Holds the create form
     */
    public createForm: FormGroup;

    /**
     * Define the columns to show
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'title',
            width: 'auto'
        },
        {
            prop: 'amount',
            width: this.singleButtonWidth
        }
    ];

    /**
     * Define extra filter properties
     */
    public filterProps = ['prefixedName'];

    /**
     * helper for permission checks
     *
     * @returns true if the user may alter motions or their metadata
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms(Permission.motionsCanManage);
    }

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param route
     * @param storage
     * @param repo
     * @param formBuilder
     * @param operator
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        public repo: CategoryRepositoryService,
        private formBuilder: FormBuilder,
        private dialog: MatDialog,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar, storage);

        this.createForm = this.formBuilder.group({
            prefix: [''],
            name: ['', Validators.required],
            parent_id: ['']
        });
    }

    /**
     * Observe the agendaItems for changes.
     */
    public ngOnInit(): void {
        super.setTitle('Categories');
    }

    /**
     * Click handler for the plus button
     */
    public onPlusButton(): void {
        this.createForm.reset();
        this.dialogRef = this.dialog.open(this.newCategoryDialog, infoDialogSettings);
        this.dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.save();
            }
        });
    }

    /**
     * Sends the category to create to the repository.
     */
    private save(): void {
        if (this.createForm.valid) {
            this.repo.create(this.createForm.value).catch(this.raiseError);
        }
    }

    /**
     * clicking Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.save();
            this.dialogRef.close();
        }
        if (event.key === 'Escape') {
            this.dialogRef.close();
        }
    }

    public getMargin(category: ViewCategory): string {
        return `${category.level * 20}px`;
    }
}
