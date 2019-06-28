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
import { StorageService } from 'app/core/core-services/storage.service';
import { auditTime } from 'rxjs/operators';

/**
 * Determine the possible file format
 */
export enum FileFormat {
    PDF = 1,
    CSV,
    XLSX
}

/**
 * Shape the structure of the dialog data
 */
export interface ExportFormData {
    format?: FileFormat;
    lnMode?: LineNumberingMode;
    crMode?: ChangeRecoMode;
    content?: string[];
    metaInfo?: InfoToExport[];
    pdfOptions?: string[];
    comments?: number[];
}

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
     * to use the format in the template
     */
    public fileFormat = FileFormat;

    /**
     * The form that contains the export information.
     */
    public exportForm: FormGroup;

    /**
     * The default export values in contrast to the restored values
     */
    private defaults: ExportFormData = {
        format: FileFormat.PDF,
        content: ['text', 'reason'],
        pdfOptions: ['toc', 'page'],
        metaInfo: ['submitters', 'state', 'recommendation', 'category', 'origin', 'tags', 'motion_block', 'polls', 'id']
    };

    /**
     * Determine the export order of the meta data
     */
    public metaInfoExportOrder: string[];

    /**
     * @returns a list of availavble commentSections
     */
    public get commentsToExport(): ViewMotionCommentSection[] {
        return this.commentRepo.getViewModelList();
    }

    /**
     * To deactivate the export-as-diff button
     */
    @ViewChild('diffVersionButton', { static: true })
    public diffVersionButton: MatButtonToggle;

    /**
     * To deactivate the voting result button
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
        public commentRepo: MotionCommentSectionRepositoryService,
        private store: StorageService
    ) {
        this.defaults.lnMode = this.configService.instant('motions_default_line_numbering');
        this.defaults.crMode = this.configService.instant('motions_recommendation_text_mode');
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
        this.exportForm.valueChanges.pipe(auditTime(500)).subscribe((value: ExportFormData) => {
            this.store.set('motion_export_selection', value);
        });

        this.exportForm.get('format').valueChanges.subscribe((value: FileFormat) => this.onFormatChange(value));
    }

    /**
     * React to changes on the file format
     * @param format
     */
    private onFormatChange(format: FileFormat): void {
        // XLSX cannot have "content"
        if (format === FileFormat.XLSX) {
            this.disableControl('content');
        } else {
            this.enableControl('content');
        }

        if (format === FileFormat.CSV || format === FileFormat.XLSX) {
            this.disableControl('lnMode');
            this.disableControl('crMode');
            this.disableControl('comments');
            this.disableControl('pdfOptions');

            // remove the selection of "votingResult"
            let metaInfoVal: string[] = this.exportForm.get('metaInfo').value;
            if (metaInfoVal) {
                metaInfoVal = metaInfoVal.filter(info => {
                    return info !== 'polls';
                });
                this.exportForm.get('metaInfo').setValue(metaInfoVal);
            }
            this.votingResultButton.disabled = true;
        }

        if (format === FileFormat.PDF) {
            this.enableControl('lnMode');
            this.enableControl('crMode');
            this.enableControl('comments');
            this.enableControl('pdfOptions');
            this.votingResultButton.disabled = false;
        }
    }

    /**
     * Helper function to easier enable a control
     * @param name
     */
    private enableControl(name: string): void {
        this.exportForm.get(name).enable();
    }

    /**
     * Helper function to easier disable a control
     *
     * @param name
     */
    private disableControl(name: string): void {
        this.exportForm.get(name).disable();
        this.exportForm.get(name).setValue(this.getOffState(name));
    }

    /**
     * Determine what "off means in certain states"
     *
     * @param control
     */
    private getOffState(control: string): string | null {
        switch (control) {
            case 'lnMode':
                return this.lnMode.None;
            case 'crMode':
                return this.crMode.Original;
            default:
                return null;
        }
    }

    /**
     * Creates the form with default values
     */
    public createForm(): void {
        this.exportForm = this.formBuilder.group({
            format: [],
            lnMode: [],
            crMode: [],
            content: [],
            metaInfo: [],
            pdfOptions: [],
            comments: []
        });

        // restore selection or set default
        this.store.get<ExportFormData>('motion_export_selection').then(restored => {
            if (!!restored) {
                this.exportForm.patchValue(restored);
            } else {
                this.exportForm.patchValue(this.defaults);
            }
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
