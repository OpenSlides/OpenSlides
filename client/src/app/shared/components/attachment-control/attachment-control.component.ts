import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { ControlValueAccessor, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';

@Component({
    selector: 'os-attachment-control',
    templateUrl: './attachment-control.component.html',
    styleUrls: ['./attachment-control.component.scss']
})
export class AttachmentControlComponent implements OnInit, ControlValueAccessor {
    /**
     * Output for an error handler
     */
    @Output()
    public errorHandler: EventEmitter<string> = new EventEmitter();

    /**
     * The form-control name to access the value for the form-control
     */
    @Input()
    public controlName: FormControl;

    /**
     * The file list that is necessary for the `SearchValueSelector`
     */
    public mediaFileList: Observable<ViewMediafile[]>;

    /**
     * Default constructor
     *
     * @param dialogService Reference to the `MatDialog`
     * @param mediaService Reference for the `MediaFileRepositoryService`
     */
    public constructor(private dialogService: MatDialog, private mediaService: MediafileRepositoryService) {}

    /**
     * On init method
     */
    public ngOnInit(): void {
        this.mediaFileList = this.mediaService
            .getViewModelListObservable()
            .pipe(map(files => files.filter(file => !file.is_directory)));
    }

    /**
     * Function to open a given dialog
     *
     * @param dialog the dialog to open
     */
    public openUploadDialog(dialog: TemplateRef<string>): void {
        this.dialogService.open(dialog, { ...mediumDialogSettings, disableClose: false });
    }

    /**
     * Function to set the value for the `SearchValueSelector` after successful upload
     *
     * @param fileIDs a list with the ids of the uploaded files
     */
    public uploadSuccess(fileIDs: number[]): void {
        if (this.controlName) {
            const newValues = [...this.controlName.value, ...fileIDs];
            this.controlName.setValue(newValues);
            this.dialogService.closeAll();
        }
    }

    /**
     * Function to emit an occurring error.
     *
     * @param error The occurring error
     */
    public uploadError(error: string): void {
        this.errorHandler.emit(error);
    }

    /**
     * Function to write a new value to the form.
     * Satisfy the interface.
     *
     * @param value The new value for this form.
     */
    public writeValue(value: any): void {
        if (value && this.controlName) {
            this.controlName.setValue(value);
        }
    }

    /**
     * Function executed when the control's value changed.
     *
     * @param fn the function that is executed.
     */
    public registerOnChange(fn: any): void {}

    /**
     * To satisfy the interface
     *
     * @param fn the registered callback function for onBlur-events.
     */
    public registerOnTouched(fn: any): void {}
}
