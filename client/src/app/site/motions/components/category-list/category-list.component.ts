import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { Category } from '../../../../shared/models/motions/category';
import { CategoryRepositoryService } from '../../services/category-repository.service';
import { ViewCategory } from '../../models/view-category';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Motion } from '../../../../shared/models/motions/motion';
import { SortingListComponent } from '../../../../shared/components/sorting-list/sorting-list.component';
import { PromptService } from 'app/core/services/prompt.service';

/**
 * List view for the categories.
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseComponent implements OnInit {
    /**
     * Hold the category to create
     */
    public categoryToCreate: Category | null;

    /**
     * Determine which category to edit
     */
    public editId: number | null;

    /**
     * Source of the data
     */
    public categories: Array<ViewCategory>;

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
     * @param repo
     * @param formBuilder
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private repo: CategoryRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService
    ) {
        super(titleService, translate);

        this.createForm = this.formBuilder.group({
            prefix: ['', Validators.required],
            name: ['', Validators.required]
        });

        this.updateForm = this.formBuilder.group({
            prefix: ['', Validators.required],
            name: ['', Validators.required]
        });
    }

    /**
     * Event on Key Down in form
     */
    public keyDownFunction(event: KeyboardEvent, viewCategory?: ViewCategory): void {
        if (event.keyCode === 13) {
            console.log('hit enter');
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
    public async onCreateButton(): Promise<void> {
        if (this.createForm.valid) {
            this.categoryToCreate.patchValues(this.createForm.value as Category);
            await this.repo.create(this.categoryToCreate)
            this.categoryToCreate = null;
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
            prefix: viewCategory.prefix,
            name: viewCategory.name
        });
    }

    /**
     * Saves the categories
     */
    public async onSaveButton(viewCategory: ViewCategory): Promise<void> {
        if (this.updateForm.valid) {
            await this.repo.update(this.updateForm.value as Partial<Category>, viewCategory);
            this.onCancelButton();
            this.sortDataSource();
        }

        // get the sorted motions
        if (this.sortSelector) {
            const manuallySortedMotions = this.sortSelector.array as Motion[];
            await this.repo.updateCategoryNumbering(viewCategory.category, manuallySortedMotions);
        }
    }

    /**
     * sorts the categories by prefix
     */
    protected sortDataSource(): void {
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
     */
    public async onDeleteButton(viewCategory: ViewCategory): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${viewCategory.name}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            await this.repo.delete(viewCategory);
            this.onCancelButton();
        }
    }

    /**
     * Returns the motions corresponding to a category
     * @param category target
     */
    public motionsInCategory(category: Category): Array<Motion> {
        const motList = this.repo.getMotionsOfCategory(category);
        motList.sort((motion1, motion2) => (motion1 > motion2 ? 1 : -1));
        return motList;
    }
}
