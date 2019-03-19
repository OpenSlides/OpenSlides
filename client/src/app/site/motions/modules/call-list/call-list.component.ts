import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { MotionCsvExportService } from 'app/site/motions/services/motion-csv-export.service';
import { MotionPdfExportService } from 'app/site/motions/services/motion-pdf-export.service';
import { SortingTreeComponent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { CanComponentDeactivate } from 'app/shared/utils/watch-sorting-tree.guard';

/**
 * Sort view for the call list.
 */
@Component({
    selector: 'os-call-list',
    templateUrl: './call-list.component.html'
})
export class CallListComponent extends BaseViewComponent implements CanComponentDeactivate {
    /**
     * Reference to the sorting tree.
     */
    @ViewChild('osSortedTree')
    private osSortTree: SortingTreeComponent<ViewMotion>;

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
     * Updates the motions member, and sorts it.
     * @param title
     * @param translate
     * @param matSnackBar
     * @param motionRepo
     * @param promptService
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private motionRepo: MotionRepositoryService,
        private motionCsvExport: MotionCsvExportService,
        private motionPdfExport: MotionPdfExportService,
        private promptService: PromptService
    ) {
        super(title, translate, matSnackBar);

        this.motionsObservable = this.motionRepo.getViewModelListObservable();
        this.motionsObservable.subscribe(motions => {
            // Sort motions and make a copy, so it will stay sorted.
            this.motions = motions.map(x => x).sort((a, b) => a.callListWeight - b.callListWeight);
        });
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
     * Function to get an info if changes has been made.
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
     * Function to open a prompt dialog,
     * so the user will be warned if he has made changes and not saved them.
     *
     * @returns The result from the prompt dialog.
     */
    public async canDeactivate(): Promise<boolean> {
        if (this.hasChanged) {
            const title = this.translate.instant('You made changes.');
            const content = this.translate.instant('Do you really want to exit?');
            return await this.promptService.open(title, content);
        }
        return true;
    }
}
