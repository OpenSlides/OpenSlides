import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MatSnackBar } from '@angular/material';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { SortingListComponent } from 'app/shared/components/sorting-list/sorting-list.component';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotion } from 'app/site/motions/models/view-motion';

/**
 * View for rearranging and renumbering the motions of a category. The {@link onNumberMotions}
 * method sends a request to the server to re-number the given motions in the order
 * as displayed in this view
 */
@Component({
    selector: 'os-category-sort',
    templateUrl: './category-sort.component.html',
    styleUrls: ['./category-sort.component.scss']
})
export class CategorySortComponent extends BaseViewComponent implements OnInit {
    /**
     * The current category. Determined by the route
     */
    public category: ViewCategory;

    /**
     * A behaviorSubject emitting the currently asigned motions on change
     */
    public motionsSubject = new BehaviorSubject<ViewMotion[]>([]);

    /**
     * Counter indicating the amount of motions currently in the category
     */
    public motionsCount = 0;

    /**
     * @returns an observable for the {@link motionsSubject}
     */
    public get motionObservable(): Observable<ViewMotion[]> {
        return this.motionsSubject.asObservable();
    }

    /**
     * @returns the name and (if present) prefix of the category
     */
    public get categoryName(): string {
        if (!this.category) {
            return '';
        }
        return this.category.prefix ? `${this.category.name} (${this.category.prefix})` : this.category.name;
    }

    /**
     * The Sort Component
     */
    @ViewChild('sorter')
    public sortSelector: SortingListComponent;

    /**
     * Constructor. Calls parents
     *
     * @param title
     * @param translate
     * @param matSnackBar
     * @param promptService
     * @param repo
     * @param route
     * @param motionRepo
     */
    public constructor(
        title: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private promptService: PromptService,
        private repo: CategoryRepositoryService,
        private route: ActivatedRoute,
        private motionRepo: MotionRepositoryService
    ) {
        super(title, translate, matSnackBar);
    }

    /**
     * Subscribes to the category and motions of this category.
     */
    public ngOnInit(): void {
        const category_id: number = +this.route.snapshot.params.id;
        this.repo.getViewModelObservable(category_id).subscribe(cat => {
            this.category = cat;
        });
        this.motionRepo.getViewModelListObservable().subscribe(motions => {
            const filtered = motions.filter(m => m.category_id === category_id);
            this.motionsCount = filtered.length;
            this.motionsSubject.next(filtered);
        });
    }

    /**
     * Triggers a (re-)numbering of the motions after a configmarion dialog
     *
     * @param category
     */
    public async onNumberMotions(): Promise<void> {
        if (this.sortSelector) {
            const title = this.translate.instant('Are you sure you want to renumber all motions of this category?');
            const content = this.category.getTitle();
            if (await this.promptService.open(title, content)) {
                const sortedMotionIds = this.sortSelector.array.map(selectable => selectable.id);
                await this.repo
                    .numberMotionsInCategory(this.category.category, sortedMotionIds)
                    .then(null, this.raiseError);
            }
        }
    }
}
