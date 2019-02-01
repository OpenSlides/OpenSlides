import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Category } from '../../../../shared/models/motions/category';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { ViewCategory } from '../../models/view-category';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Motion } from '../../../../shared/models/motions/motion';
import { SortingListComponent } from '../../../../shared/components/sorting-list/sorting-list.component';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { BaseViewComponent } from '../../../base/base-view';
import { MatSnackBar } from '@angular/material';

/**
 * List view for the categories.
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseViewComponent implements OnInit {
    /**
     * Hold the category to create
     */
    public categoryToCreate: Category | null;

    /**
     * Determine which category to edit
     */
    public editId: number | null;

    /**
     * Determine which category is opened.
     */
    public openId: number | null;

    /**
     * Source of the data
     */
    public categories: ViewCategory[];

    /**
     * For new categories
     */
    public createForm: FormGroup;

    /**
     * The current focussed form
     */
    public updateForm: FormGroup;

    /**
     * The MultiSelect Component
     */
    @ViewChild('sorter')
    public sortSelector: SortingListComponent;

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: CategoryRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService
    ) {
        super(titleService, translate, matSnackBar);

        this.createForm = this.formBuilder.group({
            prefix: [''],
            name: ['', Validators.required]
        });

        this.updateForm = this.formBuilder.group({
            prefix: [''],
            name: ['', Validators.required]
        });
    }

    /**
     * Event on key-down in form
     * @param event
     * @param viewCategory
     */
    public keyDownFunction(event: KeyboardEvent, viewCategory?: ViewCategory): void {
        if (event.key === 'Enter') {
            if (viewCategory) {
                this.onSaveButton(viewCategory);
            } else {
                this.onCreateButton();
            }
        }
    }

    /**
     * Init function.
     *
     * Sets the title and gets/observes categories from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Category');
        this.repo.getViewModelListObservable().subscribe(newViewCategories => {
            this.categories = newViewCategories;
            this.sortDataSource();
        });
    }

    /**
     * Add a new Category.
     */
    public onPlusButton(): void {
        if (!this.categoryToCreate) {
            this.categoryToCreate = new Category();
            this.createForm.reset();
        }
    }

    /**
     * Creates a new category. Executed after hitting save.
     */
    public onCreateButton(): void {
        if (this.createForm.valid) {
            const cat: Partial<Category> = { name: this.createForm.get('name').value };
            if (this.createForm.get('prefix').value) {
                cat.prefix = this.createForm.get('prefix').value;
            }
            this.categoryToCreate.patchValues(cat);

            this.repo.create(this.categoryToCreate).then(() => (this.categoryToCreate = null), this.raiseError);
        }
    }

    /**
     * Category specific edit button
     * @param viewCategory individual cat
     */
    public onEditButton(viewCategory: ViewCategory): void {
        this.editId = viewCategory.id;
        this.updateForm.reset();
        this.updateForm.patchValue({
            prefix: viewCategory.category.prefix,
            name: viewCategory.name
        });
    }

    /**
     * Saves the category
     *
     * TODO: Do not number the motions. This needs to be a separate button (maybe with propting for confirmation), because
     * not every body uses this and this would destroy their own order in motion identifiers.
     * See issue #3969
     *
     * @param viewCategory
     */
    public async onSaveButton(viewCategory: ViewCategory): Promise<void> {
        // get the sorted motions. Save them before updating the category.
        let sortedMotionIds;
        if (this.sortSelector) {
            sortedMotionIds = this.sortSelector.array.map(selectable => selectable.id);
            this.repo.numberMotionsInCategory(viewCategory.category, sortedMotionIds);
        }

        if (this.updateForm.valid) {
            const cat: Partial<Category> = { name: this.updateForm.get('name').value };
            if (this.updateForm.get('prefix').value) {
                cat.prefix = this.updateForm.get('prefix').value;
            }
            // wait for the category to update; then the (maybe) changed prefix can be applied to the motions
            await this.repo.update(cat, viewCategory);
            this.onCancelButton();

            if (this.sortSelector) {
                this.repo.numberMotionsInCategory(viewCategory.category, sortedMotionIds);
            }
        }
    }

    /**
     * sorts the categories by prefix
     */
    private sortDataSource(): void {
        this.categories.sort((viewCategory1, viewCategory2) => (viewCategory1 > viewCategory2 ? 1 : -1));
    }

    /**
     * executed on cancel button
     * @param viewCategory
     */
    public onCancelButton(): void {
        this.editId = null;
    }

    /**
     * is executed, when the delete button is pressed
     * @param viewCategory The category to delete
     */
    public async onDeleteButton(viewCategory: ViewCategory): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${viewCategory.name}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(viewCategory).then(() => this.onCancelButton(), this.raiseError);
        }
    }

    /**
     * Returns the motions corresponding to a category
     * @param category target
     * @returns all motions in the category
     */
    public motionsInCategory(category: Category): Motion[] {
        const motions = this.repo.getMotionsOfCategory(category);
        motions.sort((motion1, motion2) => (motion1 > motion2 ? 1 : -1));
        return motions;
    }

    /**
     * Is executed when a mat-extension-panel is closed
     * @param viewCategory the category in the panel
     */
    public panelClosed(viewCategory: ViewCategory): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(viewCategory);
        }
    }
}
