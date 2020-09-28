import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AmendmentFilterListService } from '../../services/amendment-filter-list.service';
import { AmendmentSortListService } from '../../services/amendment-sort-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { MotionExportDialogComponent } from '../shared-motion/motion-export-dialog/motion-export-dialog.component';
import { MotionExportInfo, MotionExportService } from '../../services/motion-export.service';
import { MotionMultiselectService } from '../../services/motion-multiselect.service';
import { MotionPdfExportService } from '../../services/motion-pdf-export.service';
import { MotionSortListService } from '../../services/motion-sort-list.service';
import { ViewMotion } from '../../models/view-motion';

/**
 * Shows all the amendments in the NGrid table
 */
@Component({
    selector: 'os-amendment-list',
    templateUrl: './amendment-list.component.html',
    styleUrls: ['./amendment-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class AmendmentListComponent extends BaseListViewComponent<ViewMotion> implements OnInit {
    /**
     * Hold the Id of the parent motion
     */
    private parentMotionId: number;

    /**
     * Hold the parent motion if present
     */
    public parentMotion: Observable<ViewMotion>;

    /**
     * Hold item visibility
     */
    public itemVisibility = ItemVisibilityChoices;

    public showSequentialNumber: boolean;

    /**
     * Column defintiion
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'meta',
            minWidth: 250,
            width: 'auto'
        },
        {
            prop: 'summary',
            minWidth: 280,
            width: 'auto'
        },
        {
            prop: 'speakers',
            width: this.singleButtonWidth
        }
    ];

    /**
     * To filter stuff
     */
    public filterProps = ['submitters', 'title', 'identifier', 'amendment_paragraphs'];

    /**
     *
     * @param titleService set the title
     * @param translate translate stuff
     * @param matSnackBar show errors
     * @param storage store and recall
     * @param motionRepo get the motions
     * @param motionSortService the default motion sorter
     *
     * @param Service get config vars
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        private route: ActivatedRoute,
        public motionRepo: MotionRepositoryService,
        public motionSortService: MotionSortListService,
        public motionMultiSelectService: MotionMultiselectService,
        public amendmentSortService: AmendmentSortListService,
        public amendmentFilterService: AmendmentFilterListService,
        private dialog: MatDialog,
        private motionExport: MotionExportService,
        private linenumberingService: LinenumberingService,
        private pdfExport: MotionPdfExportService,
        private overlayService: OverlayService,
        private configService: ConfigService
    ) {
        super(titleService, translate, matSnackBar, storage);
        super.setTitle('Amendments');
        this.canMultiSelect = true;
    }

    public ngOnInit(): void {
        // determine if a paramter exists.
        if (this.route.snapshot.paramMap.get('id')) {
            // set the parentMotion observable. This will "only" fire
            // if there is a subscription to the parent motion
            this.parentMotion = this.route.paramMap.pipe(
                switchMap((params: ParamMap) => {
                    this.parentMotionId = +params.get('id');
                    this.amendmentFilterService.parentMotionId = this.parentMotionId;
                    return this.motionRepo.getViewModelObservable(this.parentMotionId);
                })
            );
        } else {
            this.amendmentFilterService.parentMotionId = undefined;
        }

        this.configService
            .get<boolean>('motions_show_sequential_numbers')
            .subscribe(show => (this.showSequentialNumber = show));
    }

    /**
     * Formulate the amendment summary
     *
     * @param amendment the motion to create the amendment to
     * @returns the amendments as string, if they are multiple they gonna be separated by `[...]`
     */
    public getAmendmentSummary(amendment: ViewMotion): string {
        const diffLines = amendment.diffLines;
        if (diffLines.length) {
            return diffLines
                .map(diffLine => {
                    return this.linenumberingService.stripLineNumbers(diffLine.text);
                })
                .join('[...]');
        } else {
            return amendment.text;
        }
    }

    // todo put in own file
    public openExportDialog(): void {
        const exportDialogRef = this.dialog.open(MotionExportDialogComponent, {
            ...largeDialogSettings,
            data: this.dataSource
        });

        exportDialogRef
            .afterClosed()
            .subscribe((exportInfo: MotionExportInfo) =>
                this.motionExport.evaluateExportRequest(
                    exportInfo,
                    this.isMultiSelect ? this.selectedRows : this.dataSource.filteredData
                )
            );
    }

    /**
     * Function to await the promises. Afterwards it will hide the spinner.
     *
     * @param action The promise to await.
     */
    public async multiselectWrapper(action: Promise<void>): Promise<void> {
        action.then(() => this.overlayService.hideSpinner(), this.raiseError);
    }

    /**
     * Export the given motion ist as special PDF
     */
    public exportAmendmentListPdf(): void {
        const parentMotion = this.parentMotionId ? this.motionRepo.getViewModel(this.parentMotionId) : undefined;
        this.pdfExport.exportAmendmentList(this.dataSource.filteredData, parentMotion);
    }
}
