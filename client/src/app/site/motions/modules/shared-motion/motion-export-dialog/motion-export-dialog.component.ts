import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { MatDialogRef } from '@angular/material/dialog';

import { BehaviorSubject } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { StorageService } from 'app/core/core-services/storage.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewMotionCommentSection } from 'app/site/motions/models/view-motion-comment-section';
import {
    ChangeRecoMode,
    ExportFileFormat,
    LineNumberingMode,
    PERSONAL_NOTE_ID
} from 'app/site/motions/motions.constants';
import { motionImportExportHeaderOrder, noMetaData } from 'app/site/motions/motions.constants';
import { MotionExportInfo } from 'app/site/motions/services/motion-export.service';

/**
 * Dialog component to determine exporting.
 */
@Component({
    selector: 'os-motion-export-dialog',
    templateUrl: './motion-export-dialog.component.html',
    styleUrls: ['./motion-export-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MotionExportDialogComponent implements OnInit {
    /**
     * import PERSONAL_NOTE_ID for use in template
     */
    public PERSONAL_NOTE_ID = PERSONAL_NOTE_ID;

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
    public fileFormat = ExportFileFormat;

    /**
     * The form that contains the export information.
     */
    public exportForm: FormGroup;

    /**
     * Store the subject to the ViewMotionCommentSection
     */
    private commentsSubject: BehaviorSubject<ViewMotionCommentSection[]>;

    /**
     * The default export values in contrast to the restored values
     */
    private defaults: MotionExportInfo = {
        format: ExportFileFormat.PDF,
        content: ['text', 'reason'],
        pdfOptions: ['toc', 'page', 'addBreaks'],
        metaInfo: ['submitters', 'state', 'recommendation', 'category', 'origin', 'tags', 'motion_block', 'polls']
    };

    /**
     * Determine the export order of the meta data
     */
    public metaInfoExportOrder: string[];

    /**
     * @returns a list of available commentSections
     */
    public get commentsToExport(): ViewMotionCommentSection[] {
        return this.commentsSubject ? this.commentsSubject.value : [];
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
     * To deactivate the speakers button.
     */
    @ViewChild('speakersButton')
    public speakersButton: MatButtonToggle;

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
        this.commentsSubject = this.commentRepo.getViewModelListBehaviorSubject();
        if (this.configService.instant('motions_show_sequential_numbers')) {
            this.defaults.metaInfo.push('id');
        }
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
        this.exportForm.valueChanges.pipe(auditTime(500)).subscribe((value: MotionExportInfo) => {
            this.store.set('motion_export_selection', value);
        });

        this.exportForm.get('format').valueChanges.subscribe((value: ExportFileFormat) => this.onFormatChange(value));
    }

    /**
     * React to changes on the file format
     * @param format
     */
    private onFormatChange(format: ExportFileFormat): void {
        // XLSX cannot have "content"
        if (format === ExportFileFormat.XLSX) {
            this.disableControl('content');
            this.changeStateOfButton(this.speakersButton, false);
        } else {
            this.enableControl('content');
            this.changeStateOfButton(this.speakersButton, true);
        }

        if (format === ExportFileFormat.CSV || format === ExportFileFormat.XLSX) {
            this.disableControl('lnMode');
            this.disableControl('crMode');
            this.disableControl('pdfOptions');

            // remove the selection of "votingResult"
            if (format === ExportFileFormat.CSV) {
                this.disableMetaInfoControl('polls', 'speakers');
            } else {
                this.disableMetaInfoControl('polls');
            }
            this.votingResultButton.disabled = true;
        }

        if (format === ExportFileFormat.PDF) {
            this.enableControl('lnMode');
            this.enableControl('crMode');
            this.enableControl('pdfOptions');
            this.votingResultButton.disabled = false;
        }
    }

    /**
     * Function to change the state of the property `disabled` of a given button.
     *
     * Ensures, that the button exists.
     *
     * @param button The button whose state will change.
     * @param nextState The next state the button will assume.
     */
    private changeStateOfButton(button: MatButtonToggle, nextState: boolean): void {
        if (button) {
            button.disabled = nextState;
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
     * Function to deactivate at least one field of the meta-info.
     *
     * @param fields All fields to deactivate.
     */
    private disableMetaInfoControl(...fields: string[]): void {
        let metaInfoVal: string[] = this.exportForm.get('metaInfo').value;
        if (metaInfoVal) {
            metaInfoVal = metaInfoVal.filter(info => !fields.includes(info));
            this.exportForm.get('metaInfo').setValue(metaInfoVal);
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
        this.store.get<MotionExportInfo>('motion_export_selection').then(restored => {
            if (restored) {
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
