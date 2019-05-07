import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { Category } from 'app/shared/models/motions/category';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotion } from 'app/site/motions/models/view-motion';

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
     * Determine which category is opened
     */
    public editId: number | null;

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
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private repo: CategoryRepositoryService,
        private motionRepo: MotionRepositoryService,
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
     * Event on key-down in form. Submits the current form if the 'enter' button is pressed
     *
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
     * Saves a category
     * TODO: Some feedback
     *
     * @param viewCategory
     */
    public async onSaveButton(viewCategory: ViewCategory): Promise<void> {
        if (this.updateForm.dirty && this.updateForm.valid) {
            const cat: Partial<Category> = { name: this.updateForm.get('name').value };
            cat.prefix = this.updateForm.get('prefix').value || '';
            await this.repo.update(cat, viewCategory);
            this.updateForm.markAsPristine();
        }
    }

    /**
     * Trigger after cancelling an edit. The updateForm is reset to an original
     * value, which might belong to a different category
     */
    public onCancelButton(): void {
        this.updateForm.markAsPristine();
    }

    /**
     * is executed, when the delete button is pressed
     *
     * @param viewCategory The category to delete
     */
    public async onDeleteButton(viewCategory: ViewCategory): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this category?');
        const content = viewCategory.getTitle();
        if (await this.promptService.open(title, content)) {
            this.repo.delete(viewCategory).then(() => this.onCancelButton(), this.raiseError);
        }
    }

    /**
     * Returns the motions corresponding to a category
     *
     * @param category target
     * @returns all motions in the category
     */
    public motionsInCategory(category: Category): ViewMotion[] {
        return this.motionRepo.getSortedViewModelList().filter(m => m.category_id === category.id);
    }

    /**
     * Function to get a sorted list of all motions in a specific category.
     * Sorting by `category_weight`.
     *
     * @param category the target category in where the motions are.
     *
     * @returns all motions in the given category sorted by their category_weight.
     */
    public getSortedMotionListInCategory(category: Category): ViewMotion[] {
        return this.motionsInCategory(category).sort((a, b) => a.category_weight - b.category_weight);
    }

    /**
     * Fetch the correct URL for a detail sort view
     *
     * @param viewCategory
     */
    public getSortUrl(viewCategory: ViewCategory): string {
        return `/motions/category/${viewCategory.id}`;
    }

    /**
     * Set/reset the initial values and the referenced category of the update form
     *
     * @param category
     */
    public setValues(category: ViewCategory): void {
        this.editId = category.id;
        this.updateForm.setValue({
            prefix: category.prefix,
            name: category.name
        });
    }
}
