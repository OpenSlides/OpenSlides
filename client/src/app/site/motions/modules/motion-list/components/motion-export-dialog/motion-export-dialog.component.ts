import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { MatDialogRef } from '@angular/material/dialog';

import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { LineNumberingMode, ChangeRecoMode } from 'app/site/motions/models/view-motion';
import { InfoToExport } from 'app/site/motions/services/motion-pdf.service';
import { ViewMotionCommentSection } from 'app/site/motions/models/view-motion-comment-section';
import { motionImportExportHeaderOrder, noMetaData } from 'app/site/motions/motion-import-export-order';

/**
 * Dialog component to determine exporting.
 */
@Component({
    selector: 'os-motion-export-dialog',
    templateUrl: './motion-export-dialog.component.html',
    styleUrls: ['./motion-export-dialog.component.scss']
})
export class MotionExportDialogComponent implements OnInit {
    /**
     * For using the enum constants from the template.
     */
    public lnMode = LineNumberingMode;

    /**
     * For using the enum constants from the template.
     */
    public crMode = ChangeRecoMode;

    /**
     * The form that contains the export information.
     */
    public exportForm: FormGroup;

    /**
     * determine the default format to export
     */
    private defaultExportFormat = 'pdf';

    /**
     * Determine the default content to export.
     */
    private defaultContentToExport = ['text', 'reason'];

    /**
     * Determine the export order of the meta data
     */
    public metaInfoExportOrder: string[];

    /**
     * Determine the default meta info to export.
     */
    private defaultInfoToExport: InfoToExport[] = [
        'submitters',
        'state',
        'recommendation',
        'category',
        'origin',
        'tags',
        'motion_block',
        'polls',
        'id'
    ];

    /**
     * @returns a list of availavble commentSections
     */
    public get commentsToExport(): ViewMotionCommentSection[] {
        return this.commentRepo.getSortedViewModelList();
    }
    /**
     * Hold the default lnMode. Will be set by the constructor.
     */
    private defaultLnMode: LineNumberingMode;

    /**
     * Hold the default crMode. Will be set by the constructor.
     */
    private defaultCrMode: ChangeRecoMode;

    /**
     * To deactivate the export-as-diff button
     */
    @ViewChild('diffVersionButton', { static: true })
    public diffVersionButton: MatButtonToggle;

    /**
     * To deactivate the export-as-diff button
     */
    @ViewChild('votingResultButton', { static: true })
    public votingResultButton: MatButtonToggle;

    /**
     * Constructor
     * Sets the default values for the lineNumberingMode and changeRecoMode and creates the form.
     * This uses "instant" over observables to prevent on-fly-changes by auto update while
     * the dialog is open.
     *
     * @param formBuilder Creates the export form
     * @param dialogRef Make the dialog available
     * @param configService
     * @param commentRepo
     */
    public constructor(
        public formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<MotionExportDialogComponent>,
        public configService: ConfigService,
        public commentRepo: MotionCommentSectionRepositoryService
    ) {
        this.defaultLnMode = this.configService.instant('motions_default_line_numbering');
        this.defaultCrMode = this.configService.instant('motions_recommendation_text_mode');
        // Get the export order, exclude everything that does not count as meta-data
        this.metaInfoExportOrder = motionImportExportHeaderOrder.filter(metaData => {
            return !noMetaData.some(noMeta => metaData === noMeta);
        });
        this.createForm();
    }

    /**
     * Init.
     * Observes the form for changes to react dynamically
     */
    public ngOnInit(): void {
        this.exportForm.get('format').valueChanges.subscribe((value: string) => {
            // disable content for xslx
            if (value === 'xlsx') {
                // disable the content selection
                this.exportForm.get('content').disable();
                // remove the selection of "content"
                this.exportForm.get('content').setValue(null);
            } else {
                this.exportForm.get('content').enable();
            }

            if (value === 'csv' || value === 'xlsx') {
                // disable and deselect "lnMode"
                this.exportForm.get('lnMode').setValue(this.lnMode.None);
                this.exportForm.get('lnMode').disable();

                // disable and deselect "Change Reco Mode"
                // TODO: The current implementation of the motion csv export does not consider anything else than
                //       the "normal" motion.text, therefore this is disabled for now
                this.exportForm.get('crMode').setValue(this.crMode.Original);
                this.exportForm.get('crMode').disable();

                this.exportForm.get('comments').disable();

                // remove the selection of "Diff Version" and set it to default or original
                // TODO: Use this over the disable block logic above when the export service supports more than
                //       just the normal motion text
                // if (this.exportForm.get('crMode').value === this.crMode.Diff) {
                //     if (this.defaultCrMode === this.crMode.Diff) {
                //         this.exportForm.get('crMode').setValue(this.crMode.Original);
                //     } else {
                //         this.exportForm.get('crMode').setValue(this.defaultCrMode);
                //     }
                // }

                // remove the selection of "votingResult"
                let metaInfoVal: string[] = this.exportForm.get('metaInfo').value;
                metaInfoVal = metaInfoVal.filter(info => {
                    return info !== 'polls';
                });
                this.exportForm.get('metaInfo').setValue(metaInfoVal);

                // disable "Diff Version" and "Voting Result"
                this.votingResultButton.disabled = true;
                // TODO: CSV Issues
                // this.diffVersionButton.disabled = true;
            } else if (value === 'pdf') {
                this.exportForm.get('comments').enable();
                this.exportForm.get('lnMode').enable();
                this.exportForm.get('lnMode').setValue(this.defaultLnMode);

                // TODO: Temporarily necessary until CSV has been fixed
                this.exportForm.get('crMode').enable();
                this.exportForm.get('crMode').setValue(this.defaultCrMode);

                // enable "Diff Version" and "Voting Result"
                this.votingResultButton.disabled = false;
                // TODO: Temporarily disabled. Will be required after CSV fixes
                // this.diffVersionButton.disabled = false;
            }
        });
    }

    /**
     * Creates the form with default values
     */
    public createForm(): void {
        this.exportForm = this.formBuilder.group({
            format: [this.defaultExportFormat],
            lnMode: [this.defaultLnMode],
            crMode: [this.defaultCrMode],
            content: [this.defaultContentToExport],
            metaInfo: [this.defaultInfoToExport],
            comments: []
        });
    }

    /**
     * Just close the dialog
     */
    public onCloseClick(): void {
        this.dialogRef.close();
    }

    /**
     * Gets the untranslated label for metaData
     */
    public getLabelForMetadata(metaDataName: string): string {
        switch (metaDataName) {
            case 'polls': {
                return 'Voting result';
            }
            case 'id': {
                return 'Sequential number';
            }
            case 'motion_block': {
                return 'Motion block';
            }
            default: {
                return metaDataName.charAt(0).toUpperCase() + metaDataName.slice(1);
            }
        }
    }
}
