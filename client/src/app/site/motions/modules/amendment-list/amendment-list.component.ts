import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { AmendmentFilterListService } from '../../services/amendment-filter-list.service';
import { AmendmentSortListService } from '../../services/amendment-sort-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseListViewComponent } from 'app/site/base/base-list-view';
import { MotionExportDialogComponent } from '../shared-motion/motion-export-dialog/motion-export-dialog.component';
import { MotionExportInfo, MotionExportService } from '../../services/motion-export.service';
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
     * Has the id of the parent motion if passed through the constructor
     */
    private parentMotionId: number;

    /**
     * Hold item visibility
     */
    public itemVisibility = ItemVisibilityChoices;

    /**
     * Column defintiion
     */
    public tableColumnDefinition: PblColumnDefinition[] = [
        {
            prop: 'meta',
            minWidth: 250,
            width: '15%'
        },
        {
            prop: 'summary',
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
     * @param configService get config vars
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        storage: StorageService,
        route: ActivatedRoute,
        public motionRepo: MotionRepositoryService,
        public motionSortService: MotionSortListService,
        public amendmentSortService: AmendmentSortListService,
        public amendmentFilterService: AmendmentFilterListService,
        private sanitizer: DomSanitizer,
        private dialog: MatDialog,
        private motionExport: MotionExportService,
        private linenumberingService: LinenumberingService
    ) {
        super(titleService, translate, matSnackBar, storage);
        super.setTitle('Amendments');
        this.canMultiSelect = true;
        this.parentMotionId = parseInt(route.snapshot.params.id, 10);
        if (this.parentMotionId) {
            this.amendmentFilterService.parentMotionId = this.parentMotionId;
        } else {
            this.amendmentFilterService.parentMotionId = undefined;
        }
    }

    public ngOnInit(): void {}

    /**
     * Extract the lines of the amendments
     * If an amendments has multiple changes, they will be printed like an array of strings
     *
     * @param amendment the motion to create the amendment to
     * @return The lines of the amendment
     */
    public getChangeLines(amendment: ViewMotion): string {
        const diffLines = amendment.diffLines;

        if (!!diffLines) {
            return diffLines
                .map(diffLine => {
                    if (diffLine.diffLineTo === diffLine.diffLineFrom + 1) {
                        return '' + diffLine.diffLineFrom;
                    } else {
                        return `${diffLine.diffLineFrom} - ${diffLine.diffLineTo - 1}`;
                    }
                })
                .toString();
        }
    }

    /**
     * Formulate the amendment summary
     *
     * @param amendment the motion to create the amendment to
     * @returns the amendments as string, if they are multiple they gonna be separated by `[...]`
     */
    public getAmendmentSummary(amendment: ViewMotion): string {
        const diffLines = amendment.diffLines;
        if (!!diffLines) {
            return diffLines
                .map(diffLine => {
                    return this.linenumberingService.stripLineNumbers(diffLine.text);
                })
                .join('[...]');
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

    public sanitizeText(text: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(text);
    }
}