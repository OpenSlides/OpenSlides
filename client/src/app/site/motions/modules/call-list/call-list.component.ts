import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { FlatNode } from 'app/core/ui-services/tree.service';
import { SortTreeFilterOption, SortTreeViewComponentDirective } from 'app/site/base/sort-tree.component';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { MotionCsvExportService } from 'app/site/motions/services/motion-csv-export.service';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';
import { ViewTag } from 'app/site/tags/models/view-tag';

/**
 * Sort view for the call list.
 */
@Component({
    selector: 'os-call-list',
    templateUrl: './call-list.component.html',
    styleUrls: [
        './call-list.component.scss',
        '../../../../shared/components/sort-filter-bar/sort-filter-bar.component.scss'
    ]
})
export class CallListComponent extends SortTreeViewComponentDirective<ViewMotion> implements OnInit {
    /**
     * All motions sorted first by weight, then by id.
     */
    public motionsObservable: Observable<ViewMotion[]>;

    /**
     * Holds all motions for the export.
     */
    private motions: ViewMotion[] = [];

    /**
     * Boolean to check if the tree has changed.
     */
    public hasChanged = false;

    /**
     * A (dynamically updating) list of available and active filters by tag
     */
    public tagFilterOptions: SortTreeFilterOption[] = [];

    /**
     * The current amount of tag filters active
     */
    public activeTagFilterCount = 0;

    /**
     * A (dynamically updating) list of available and active filters by category
     */
    public categoryFilterOptions: SortTreeFilterOption[] = [];

    /**
     * The current amount of category filters active
     */
    public activeCatFilterCount = 0;

    /**
     * BehaviorSubject to get informed every time the tag filter changes.
     */
    protected activeTagFilters: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

    /**
     * BehaviourSubject to get informed every time the category filter changes.
     */
    protected activeCatFilters: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

    /**
     * constructor. Subscribes to the motions
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param motionRepo
     * @param motionCsvExport
     * @param motionPdfExport
     * @param tagRepo
     * @param categoryRepo
     * @param promptService
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        private motionRepo: MotionRepositoryService,
        private motionCsvExport: MotionCsvExportService,
        private motionPdfExport: MotionPdfExportService,
        private tagRepo: TagRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        promptService: PromptService
    ) {
        super(title, translate, matSnackBar, promptService);

        this.motionsObservable = this.motionRepo.getViewModelListObservable();
        this.motionsObservable.subscribe(motions => {
            // Sort motions and make a copy, so it will stay sorted.
            this.motions = motions.map(x => x).sort((a, b) => a.weight - b.weight);
        });
    }

    /**
     * Initializes filters and filter subscriptions
     */
    public ngOnInit(): void {
        this.subscriptions.push(
            this.activeTagFilters.subscribe((value: number[]) => this.onSubscribedFilterChange('tag', value))
        );
        this.subscriptions.push(
            this.activeCatFilters.subscribe((value: number[]) => this.onSubscribedFilterChange('category', value))
        );
        this.subscriptions.push(
            this.tagRepo.getViewModelListBehaviorSubject().subscribe(tags => {
                if (tags && tags.length) {
                    this.tagFilterOptions = tags.map(tag => {
                        return {
                            label: tag.name,
                            id: tag.id,
                            state:
                                this.tagFilterOptions &&
                                this.tagFilterOptions.some(tagfilter => {
                                    return tagfilter.id === tag.id && tagfilter.state === true;
                                })
                        };
                    });
                    this.tagFilterOptions.push({
                        label: this.translate.instant('No tags'),
                        id: 0,
                        state:
                            this.tagFilterOptions &&
                            this.tagFilterOptions.some(tagfilter => {
                                return tagfilter.id === 0 && tagfilter.state === true;
                            })
                    });
                } else {
                    this.tagFilterOptions = [];
                }
            })
        );

        this.subscriptions.push(
            this.categoryRepo.getViewModelListBehaviorSubject().subscribe(categories => {
                if (categories && categories.length) {
                    this.categoryFilterOptions = categories.map(cat => {
                        return {
                            label: cat.prefixedName,
                            id: cat.id,
                            state:
                                this.categoryFilterOptions &&
                                this.categoryFilterOptions.some(catfilter => {
                                    return catfilter.id === cat.id && catfilter.state === true;
                                })
                        };
                    });
                    this.categoryFilterOptions.push({
                        label: this.translate.instant('No category'),
                        id: 0,
                        state:
                            this.categoryFilterOptions &&
                            this.categoryFilterOptions.some(catfilter => {
                                return catfilter.id === 0 && catfilter.state === true;
                            })
                    });
                } else {
                    this.categoryFilterOptions = [];
                }
            })
        );
    }

    /**
     * Function to save changes on click.
     */
    public async onSave(): Promise<void> {
        await this.motionRepo
            .sortMotions(this.osSortTree.getTreeData())
            .then(() => this.osSortTree.setSubscription(), this.raiseError);
    }

    /**
     * Function to restore the old state.
     */
    public async onCancel(): Promise<void> {
        if (await this.canDeactivate()) {
            this.osSortTree.setSubscription();
        }
    }

    /**
     * Function to register the info that changes has been made.
     *
     * @param hasChanged Boolean received from the tree to see that changes has been made.
     */
    public receiveChanges(hasChanged: boolean): void {
        this.hasChanged = hasChanged;
    }

    /**
     * Export the full call list as csv.
     */
    public csvExportCallList(): void {
        this.motionCsvExport.exportCallList(this.motions);
    }

    /**
     * Triggers a pdf export of the call list
     */
    public pdfExportCallList(): void {
        this.motionPdfExport.exportPdfCallList(this.motions);
    }

    /**
     * Get the tags associated with the motion of a sorting item
     *
     * @param item A FlatNode from a OsSortignTree
     * @returns An array of ViewTags (or an empty adrray)
     */
    public getTags(item: FlatNode<ViewMotion>): ViewTag[] {
        const motion = this.motionRepo.getViewModel(item.id);
        return motion ? motion.tags : [];
    }

    /**
     * Toggles a filter. An array with the filter ids array will be emitted
     * as active/model/Filters
     *
     * @param model either 'tag' or 'category' for the filter that changed
     * @param filter the filter that is supposed to be toggled.
     */
    public onFilterChange(model: 'tag' | 'category', filter: number): void {
        const value = model === 'tag' ? this.activeTagFilters.value : this.activeCatFilters.value;
        if (!value.includes(filter)) {
            value.push(filter);
        } else {
            value.splice(value.indexOf(filter), 1);
        }
        if (model === 'tag') {
            this.activeTagFilters.next(value);
        } else {
            this.activeCatFilters.next(value);
        }
    }

    /**
     * Function to unset all active filters.
     */
    public resetFilters(): void {
        this.activeTagFilters.next([]);
        this.activeCatFilters.next([]);
    }

    /**
     * This method requires a confirmation from the user
     * and starts the sorting by the property `identifier` of the motions
     * in case of `true`.
     */
    public async sortMotionsByIdentifier(): Promise<void> {
        const title = this.translate.instant('Do you really want to go ahead?');
        const text = this.translate.instant('This will reset all made changes and sort the call list.');
        if (await this.promptService.open(title, text)) {
            this.forceSort.emit('identifier');
        }
    }

    /**
     * Helper to trigger an update of the filter itself and the information about
     * the state of filters
     *
     * @param model the property/model the filter is for
     * @param value
     */
    private onSubscribedFilterChange(model: 'tag' | 'category', value: number[]): void {
        if (model === 'tag') {
            this.activeTagFilterCount = value.length;
            this.tagFilterOptions.forEach(filterOption => {
                filterOption.state = value && value.some(v => v === filterOption.id);
            });
        } else {
            this.activeCatFilterCount = value.length;
            this.categoryFilterOptions.forEach(filterOption => {
                filterOption.state = value && value.some(v => v === filterOption.id);
            });
        }
        this.hasActiveFilter = this.activeCatFilterCount > 0 || this.activeTagFilterCount > 0;

        const currentTagFilters = this.tagFilterOptions.filter(option => option.state === true);
        const currentCategoryFilters = this.categoryFilterOptions.filter(option => option.state === true);
        this.changeFilter.emit(
            // TODO this is ugly and potentially reversed
            (item: ViewMotion): boolean => {
                if (currentTagFilters.length) {
                    if (!item.tags || !item.tags.length) {
                        if (!currentTagFilters.some(filter => filter.id === 0)) {
                            return true;
                        }
                    } else if (!item.tags.some(tag => currentTagFilters.some(filter => filter.id === tag.id))) {
                        return true;
                    }
                }
                if (currentCategoryFilters.length) {
                    const category_id = item.category_id || 0;
                    return !currentCategoryFilters.some(filter => filter.id === category_id);
                }
                return false;
            }
        );
    }
}
