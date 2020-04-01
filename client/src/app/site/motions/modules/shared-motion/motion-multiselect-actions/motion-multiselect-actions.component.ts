import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewCategory } from 'app/site/motions/models/view-category';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { MotionExportInfo, MotionExportService } from 'app/site/motions/services/motion-export.service';
import { MotionMultiselectService } from 'app/site/motions/services/motion-multiselect.service';
import { ViewTag } from 'app/site/tags/models/view-tag';
import { MotionExportDialogComponent } from '../motion-export-dialog/motion-export-dialog.component';

@Component({
    selector: 'os-motion-multiselect-actions',
    templateUrl: './motion-multiselect-actions.component.html',
    styleUrls: ['./motion-multiselect-actions.component.scss']
})
export class MotionMultiselectActionsComponent extends BaseViewComponent implements OnInit {
    /**
     * The list of the selected motions.
     */
    @Input()
    public selectedMotions: ViewMotion[] = [];

    /**
     * An EventEmitter to send the selected actions.
     */
    @Output()
    public action = new EventEmitter<Promise<void>>();

    /**
     * Boolean, if the recommendation is enabled.
     */
    public recommendationEnabled = false;

    /**
     * The list of all categories.
     */
    public categories: ViewCategory[] = [];

    /**
     * The list of all tags.
     */
    public tags: ViewTag[] = [];

    /**
     * The list of all motion-blocks.
     */
    public motionBlocks: ViewMotionBlock[] = [];

    /**
     * The default constructor.
     *
     * @param multiselectService
     * @param categoryRepo
     * @param motionBlockRepo
     * @param tagRepo
     * @param configService
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public multiselectService: MotionMultiselectService,
        private categoryRepo: CategoryRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private tagRepo: TagRepositoryService,
        private configService: ConfigService,
        private dialog: MatDialog,
        private motionExport: MotionExportService
    ) {
        super(title, translate, matSnackbar);
    }

    /**
     * OnInit-method.
     *
     * Subscribe to all view-model-lists.
     */
    public ngOnInit(): void {
        this.subscriptions.push(
            this.categoryRepo.getViewModelListObservable().subscribe(categories => (this.categories = categories)),
            this.motionBlockRepo.getViewModelListObservable().subscribe(blocks => (this.motionBlocks = blocks)),
            this.tagRepo.getViewModelListObservable().subscribe(tags => (this.tags = tags)),
            this.configService.get<string>('motions_recommendations_by').subscribe(recommender => {
                this.recommendationEnabled = !!recommender;
            })
        );
    }

    /**
     * Opens the dialog to choose options for exporting selected motions.
     */
    public openExportDialog(): void {
        const exportDialogRef = this.dialog.open(MotionExportDialogComponent, largeDialogSettings);

        exportDialogRef
            .afterClosed()
            .subscribe((exportInfo: MotionExportInfo) =>
                this.motionExport.evaluateExportRequest(exportInfo, this.selectedMotions)
            );
    }
}
