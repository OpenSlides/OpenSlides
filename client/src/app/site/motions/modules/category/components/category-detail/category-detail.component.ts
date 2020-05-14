import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotion } from 'app/site/motions/models/view-motion';

/**
 * Detail component to display one motion block
 */
@Component({
    selector: 'os-category-detail',
    templateUrl: './category-detail.component.html',
    styleUrls: ['./category-detail.component.scss']
})
export class CategoryDetailComponent extends BaseViewComponent implements OnInit {
    /**
     * The one selected category
     */
    public selectedCategory: ViewCategory;

    /**
     * All categories with the selected one and all children.
     */
    public categories: ViewCategory[];

    /**
     * Datasources for `categories`. Holds all motions for one category.
     */
    public readonly dataSources: { [id: number]: MatTableDataSource<ViewMotion> } = {};

    /**
     * The form to edit the selected category
     */
    @ViewChild('editForm', { static: true })
    public editForm: FormGroup;

    /**
     * Reference to the template for edit-dialog
     */
    @ViewChild('editDialog', { static: true })
    private editDialog: TemplateRef<string>;

    /**
     * helper for permission checks
     *
     * @returns true if the user may alter motions
     */
    public get canEdit(): boolean {
        return this.operator.hasPerms(Permission.motionsCanManage);
    }

    /**
     * Constructor for motion block details
     *
     * @param titleService Setting the title
     * @param translate translations
     * @param matSnackBar showing errors
     * @param operator the current user
     * @param router navigating
     * @param route determine the blocks ID by the route
     * @param repo the motion blocks repository
     * @param motionRepo the motion repository
     * @param promptService the displaying prompts before deleting
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private route: ActivatedRoute,
        private operator: OperatorService,
        private router: Router,
        private repo: CategoryRepositoryService,
        private motionRepo: MotionRepositoryService,
        private promptService: PromptService,
        private fb: FormBuilder,
        private dialog: MatDialog
    ) {
        super(titleService, translate, matSnackBar);
    }

    /**
     * Init function.
     * Sets the title, observes the block and the motions belonging in this block
     */
    public ngOnInit(): void {
        const selectedCategoryId = parseInt(this.route.snapshot.params.id, 10);

        this.subscriptions.push(
            this.repo.getViewModelListObservable().subscribe(categories => {
                // Extract all categories, that is the selected one and all child categories
                const selectedCategoryIndex = categories.findIndex(category => category.id === selectedCategoryId);

                if (selectedCategoryIndex < 0) {
                    return;
                }

                // Find index of last child. This can be easily done by searching, because this
                // is the flat sorted tree
                this.selectedCategory = categories[selectedCategoryIndex];
                super.setTitle(this.selectedCategory.prefixedName);

                let lastChildIndex: number;
                for (
                    lastChildIndex = selectedCategoryIndex + 1;
                    lastChildIndex < categories.length &&
                    categories[lastChildIndex].level > this.selectedCategory.level;
                    lastChildIndex++
                ) {}
                this.categories = categories.slice(selectedCategoryIndex, lastChildIndex);

                // setup datasources:
                this.categories.forEach(category => {
                    const dataSource = new MatTableDataSource<ViewMotion>();
                    dataSource.data = category.motions;
                    this.dataSources[category.id] = dataSource;
                });
            })
        );
    }

    /**
     * Returns the columns that should be shown in the table
     *
     * @returns an array of strings building the column definition
     */
    public getColumnDefinition(): string[] {
        return ['title', 'state', 'recommendation', 'anchor'];
    }

    /**
     * Click handler to delete a category
     */
    public async onDeleteButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this category and all subcategories?');
        const content = this.selectedCategory.prefixedName;
        if (await this.promptService.open(title, content)) {
            await this.repo.delete(this.selectedCategory);
            this.router.navigate(['../'], { relativeTo: this.route });
        }
    }

    /**
     * Clicking escape while in editForm should deactivate edit mode.
     *
     * @param event The key that was pressed
     */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.dialog.closeAll();
        }
        if (event.key === 'Enter') {
            this.save();
        }
    }

    /**
     * Save event handler
     */
    public save(): void {
        this.repo
            .update(this.editForm.value, this.selectedCategory)
            .then(() => this.dialog.closeAll())
            .catch(this.raiseError);
    }

    /**
     * Click handler for the edit button
     */
    public toggleEditMode(): void {
        this.editForm = this.fb.group({
            prefix: [this.selectedCategory.prefix],
            name: [this.selectedCategory.name, Validators.required]
        });

        this.dialog.open(this.editDialog, infoDialogSettings);
    }

    /**
     * Fetch a motion's current recommendation label
     *
     * @param motion
     * @returns the current recommendation label (with extension)
     */
    public getRecommendationLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedRecommendationLabel(motion);
    }

    /**
     * Fetch a motion's current state label
     *
     * @param motion
     * @returns the current state label (with extension)
     */
    public getStateLabel(motion: ViewMotion): string {
        return this.motionRepo.getExtendedStateLabel(motion);
    }

    public getLevelDashes(category: ViewCategory): string {
        const relativeLevel = category.level - this.selectedCategory.level;
        return '–'.repeat(relativeLevel);
    }

    /**
     * Triggers a numbering of the motions
     */
    public async numberMotions(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to renumber all motions of this category?');
        const content = this.selectedCategory.getTitle();
        if (await this.promptService.open(title, content)) {
            await this.repo.numberMotionsInCategory(this.selectedCategory).catch(this.raiseError);
        }
    }
}
