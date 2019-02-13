import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MatButtonToggle } from '@angular/material';

import { ConfigService } from 'app/core/ui-services/config.service';
import { LineNumberingMode, ChangeRecoMode } from '../../models/view-motion';
import { InfoToExport } from '../../services/motion-pdf.service';

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
     * Determine the default meta info to export.
     */
    private defaultInfoToExport: InfoToExport[] = [
        'submitters',
        'state',
        'recommendation',
        'category',
        'origin',
        'block',
        'polls',
        'comments'
    ];

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
    @ViewChild('diffVersionButton')
    public diffVersionButton: MatButtonToggle;

    /**
     * To deactivate the export-as-diff button
     */
    @ViewChild('votingResultButton')
    public votingResultButton: MatButtonToggle;

    /**
     * Constructor
     * Sets the default values for the lineNumberingMode and changeRecoMode and creates the form.
     * This uses "instant" over observables to prevent on-fly-changes by auto update while
     * the dialog is open.
     *
     * @param formBuilder Creates the export form
     * @param dialogRef Make the dialog available
     */
    public constructor(
        public formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<MotionExportDialogComponent>,
        public configService: ConfigService
    ) {
        this.defaultLnMode = this.configService.instant('motions_default_line_numbering');
        this.defaultCrMode = this.configService.instant('motions_recommendation_text_mode');
        this.createForm();
    }

    /**
     * Init.
     * Observes the form for changes to react dynamically
     */
    public ngOnInit(): void {
        this.exportForm.get('format').valueChanges.subscribe((value: string) => {
            if (value === 'csv') {
                // disable and deselect "lnMode"
                this.exportForm.get('lnMode').setValue(this.lnMode.None);
                this.exportForm.get('lnMode').disable();

                // disable and deselect "Change Reco Mode"
                // TODO: The current implementation of the motion csv export does not consider anything else than
                //       the "normal" motion.text, therefore this is disabled for now
                this.exportForm.get('crMode').setValue(this.crMode.Original);
                this.exportForm.get('crMode').disable();

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
                    return info !== 'votingResult';
                });
                this.exportForm.get('metaInfo').setValue(metaInfoVal);

                // disable "Diff Version" and "Voting Result"
                this.votingResultButton.disabled = true;
                // TODO: CSV Issues
                // this.diffVersionButton.disabled = true;
            } else if (value === 'pdf') {
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
            metaInfo: [this.defaultInfoToExport]
        });
    }

    /**
     * Just close the dialog
     */
    public onCloseClick(): void {
        this.dialogRef.close();
    }
}
