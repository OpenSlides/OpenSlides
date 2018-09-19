import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { Category } from '../../../../shared/models/motions/category';
import { CategoryRepositoryService } from '../../services/category-repository.service';
import { ViewCategory } from '../../models/view-category';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

/**
 * List view for the categories.
 */
@Component({
    selector: 'os-category-list',
    templateUrl: './category-list.component.html',
    styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent extends BaseComponent implements OnInit, OnDestroy {
    /**
     * States the edit mode
     */
    public editMode = false;

    /**
     * Source of the Data
     */
    public dataSource: Array<ViewCategory>;

    /**
     * The current focussed formgroup
     */
    public formGroup: FormGroup;

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
        private formBuilder: FormBuilder
    ) {
        super(titleService, translate);
        this.formGroup = this.formBuilder.group({
            name: ['', Validators.required],
            prefix: ['', Validators.required]
        });
    }

    /**
     * On Destroy Function
     *
     * Saves the edits
     */
    public ngOnDestroy(): void {
        this.dataSource.forEach(viewCategory => {
            if (viewCategory.edit && viewCategory.opened) {
                const nameControl = this.formGroup.get('name');
                const prefixControl = this.formGroup.get('prefix');
                const nameValue = nameControl.value;
                const prefixValue = prefixControl.value;
                viewCategory.name = nameValue;
                viewCategory.prefix = prefixValue;
                this.saveCategory(viewCategory);
            }
        });
    }

    /**
     * Event on Key Down in form
     */
    public keyDownFunction(event: KeyboardEvent, viewCategory: ViewCategory): void {
        if (event.keyCode === 13) {
            this.onSaveButton(viewCategory);
        }
    }

    /**
     * Stores the Datamodel in the repo
     * @param viewCategory
     */
    private saveCategory(viewCategory: ViewCategory): void {
        if (this.repo.osInDataStore(viewCategory)) {
            this.repo.create(viewCategory).subscribe();
        } else {
            this.repo.update(viewCategory).subscribe();
        }
        viewCategory.edit = false;
    }
    /**
     * Init function.
     *
     * Sets the title and gets/observes categories from DataStore
     */
    public ngOnInit(): void {
        super.setTitle('Category');
        this.repo.getViewModelListObservable().subscribe(newViewCategories => {
            this.dataSource = newViewCategories;
        });
        this.sortDataSource();
    }

    /**
     * Add a new Category.
     */
    public onPlusButton(): void {
        let noNewOnes = true;
        this.dataSource.forEach(viewCategory => {
            if (viewCategory.id === undefined) {
                noNewOnes = false;
            }
        });
        if (noNewOnes) {
            const newCategory = new Category();
            newCategory.id = undefined;
            newCategory.name = this.translate.instant('Name');
            newCategory.prefix = this.translate.instant('Prefix');
            const newViewCategory = new ViewCategory(newCategory);
            newViewCategory.opened = true;
            this.dataSource.reverse();
            this.dataSource.push(newViewCategory);
            this.dataSource.reverse();
            this.editMode = true;
        }
    }

    /**
     * Executed on edit button
     * @param viewCategory
     */
    public onEditButton(viewCategory: ViewCategory): void {
        viewCategory.edit = true;
        viewCategory.synced = false;
        this.editMode = true;
        const nameControl = this.formGroup.get('name');
        const prefixControl = this.formGroup.get('prefix');
        nameControl.setValue(viewCategory.name);
        prefixControl.setValue(viewCategory.prefix);
    }

    /**
     * Saves the categories
     */
    public onSaveButton(viewCategory: ViewCategory): void {
        if (this.formGroup.controls.name.valid && this.formGroup.controls.prefix.valid) {
            this.editMode = false;
            const nameControl = this.formGroup.get('name');
            const prefixControl = this.formGroup.get('prefix');
            const nameValue = nameControl.value;
            const prefixValue = prefixControl.value;
            if (
                viewCategory.id === undefined ||
                nameValue !== viewCategory.name ||
                prefixValue !== viewCategory.prefix
            ) {
                viewCategory.prefix = prefixValue;
                viewCategory.name = nameValue;
                this.saveCategory(viewCategory);
            }
        }
        this.sortDataSource();
    }

    /**
     * sorts the datasource by prefix alphabetically
     */
    protected sortDataSource(): void {
        this.dataSource.sort((viewCategory1, viewCategory2) => {
            if (viewCategory1.prefix > viewCategory2.prefix) {
                return 1;
            }
            if (viewCategory1.prefix < viewCategory2.prefix) {
                return -1;
            }
        });
    }

    /**
     * executed on cancel button
     * @param viewCategory
     */
    public onCancelButton(viewCategory: ViewCategory): void {
        viewCategory.edit = false;
        this.editMode = false;
    }

    /**
     * is executed, when the delete button is pressed
     */
    public onDeleteButton(viewCategory: ViewCategory): void {
        if (this.repo.osInDataStore(viewCategory) && viewCategory.id !== undefined) {
            this.repo.delete(viewCategory).subscribe();
        }
        const index = this.dataSource.indexOf(viewCategory, 0);
        if (index > -1) {
            this.dataSource.splice(index, 1);
        }
        // if no category is there, we setill have to be able to create one
        if (this.dataSource.length < 1) {
            this.editMode = false;
        }
    }

    /**
     * Is executed when a mat-extension-panel is opened or closed
     * @param open true if opened, false if being closed
     * @param category the category in the panel
     */
    public panelOpening(open: boolean, category: ViewCategory): void {
        category.opened = open as boolean;
        if (category.edit === true) {
            this.onSaveButton(category);
            this.onCancelButton(category);
        }
        if (!open) {
            category.edit = false;
            this.editMode = false;
        }
    }
}
