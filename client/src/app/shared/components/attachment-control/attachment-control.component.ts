import { FocusMonitor } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    OnInit,
    Optional,
    Output,
    Self,
    TemplateRef
} from '@angular/core';
import { FormBuilder, NgControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldControl } from '@angular/material/form-field';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { BaseFormControlComponent } from 'app/shared/models/base/base-form-control';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';

@Component({
    selector: 'os-attachment-control',
    templateUrl: './attachment-control.component.html',
    styleUrls: ['./attachment-control.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: AttachmentControlComponent }],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentControlComponent extends BaseFormControlComponent<ViewMediafile[]> implements OnInit {
    /**
     * Output for an error handler
     */
    @Output()
    public errorHandler: EventEmitter<string> = new EventEmitter();

    private dialogRef: MatDialogRef<any>;

    /**
     * The file list that is necessary for the `SearchValueSelector`
     */
    public mediaFileList: Observable<ViewMediafile[]>;

    public get empty(): boolean {
        return !this.contentForm.value.length;
    }
    public get controlType(): string {
        return 'attachment-control';
    }

    public constructor(
        formBuilder: FormBuilder,
        focusMonitor: FocusMonitor,
        element: ElementRef<HTMLElement>,
        @Optional() @Self() public ngControl: NgControl,
        private dialogService: MatDialog,
        private mediaService: MediafileRepositoryService
    ) {
        super(formBuilder, focusMonitor, element, ngControl);
    }

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
        this.dialogRef = this.dialogService.open(dialog, { ...mediumDialogSettings, disableClose: false });
    }

    /**
     * Function to set the value for the `SearchValueSelector` after successful upload
     *
     * @param fileIDs a list with the ids of the uploaded files
     */
    public uploadSuccess(fileIDs: number[]): void {
        const newValues = [...this.contentForm.value, ...fileIDs];
        this.updateForm(newValues);
        this.dialogRef.close();
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
     * Declared as abstract in MatFormFieldControl and not required for this component
     */
    public onContainerClick(event: MouseEvent): void {}

    protected initializeForm(): void {
        this.contentForm = this.fb.control([]);
    }

    protected updateForm(value: ViewMediafile[] | null): void {
        this.contentForm.setValue(value || []);
    }
}
