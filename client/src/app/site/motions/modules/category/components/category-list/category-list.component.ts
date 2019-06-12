import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { ListViewBaseComponent } from 'app/site/base/list-view-base';
import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { Category } from 'app/shared/models/motions/category';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ViewCategory } from 'app/site/motions/models/view-category';

/**
 * Table for categories
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends ListViewBaseComponent<ViewCategory, Category, CategoryRepositoryService>
    implements OnInit {
    /**
     * Holds the create form
     */
    public createForm: FormGroup;

    /**
     * Flag, if the creation panel is open
     */
    public isCreatingNewCategory = false;

    /**
     * helper for permission checks
     *
     * @returns true if the user may alter motions or their metadata
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms('motions.can_manage');
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
     * @param promptService
     * @param operator
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        route: ActivatedRoute,
        storage: StorageService,
        private repo: CategoryRepositoryService,
        private formBuilder: FormBuilder,
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar, repo, route, storage);

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
        this.initTable();
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        return ['title', 'amount', 'anchor'];
    }

    /**
     * return the amount of motions in a category
     *
     * @param category the category to determine the amount of motions for
     * @returns a number that indicates how many motions are in the given category
     */
    public getMotionAmount(category: ViewCategory): number {
        return this.repo.getMotionAmountByCategory(category);
    }

    /**
     * Click handler for the plus button
     */
    public onPlusButton(): void {
        if (!this.isCreatingNewCategory) {
            this.createForm.reset();
            this.isCreatingNewCategory = true;
        }
    }

    /**
     * Click handler for the save button.
     * Sends the category to create to the repository and resets the form.
     */
    public onCreate(): void {
        if (this.createForm.valid) {
            try {
                this.repo.create(this.createForm.value);
                this.createForm.reset();
                this.isCreatingNewCategory = false;
            } catch (e) {
                this.raiseError(e);
            }
        }
        // set a form control as "touched" to trigger potential error messages
        this.createForm.get('name').markAsTouched();
    }

    /**
     * clicking Shift and Enter will save automatically
     * clicking Escape will cancel the process
     *
     * @param event has the code
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.onCreate();
        }
        if (event.key === 'Escape') {
            this.onCancel();
        }
    }

    /**
     * Cancels the current form action
     */
    public onCancel(): void {
        this.isCreatingNewCategory = false;
    }

    public getMargin(category: ViewCategory): string {
        return `${category.level * 20}px`;
    }
}
