import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { auditTime } from 'rxjs/operators';

import { ProjectionDefaultRepositoryService } from 'app/core/repositories/projector/projection-default-repository.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ProjectorComponent } from 'app/shared/components/projector/projector.component';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ClockSlideService } from '../../services/clock-slide.service';
import { ViewProjectionDefault } from '../../models/view-projection-default';
import { ViewProjector } from '../../models/view-projector';

/**
 * Dialog to edit the given projector
 * Shows a preview
 */
@Component({
    selector: 'os-projector-edit-dialog',
    templateUrl: './projector-edit-dialog.component.html',
    styleUrls: ['./projector-edit-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectorEditDialogComponent extends BaseViewComponent implements OnInit {
    /**
     * import the projector as view child, to determine when to update
     * the preview.
     */
    @ViewChild('preview')
    public preview: ProjectorComponent;

    /**
     * aspect ratios
     */
    public defaultAspectRatio: string[] = ['4:3', '16:9', '16:10'];

    /**
     * The update form. Will be refreahed for each projector. Just one update
     * form can be shown per time.
     */
    public updateForm: FormGroup;

    /**
     * All ProjectionDefaults to select from.
     */
    public projectionDefaults: ViewProjectionDefault[];

    /**
     * show a preview of the changes
     */
    public previewProjector: Projector;

    /**
     * define the maximum resolution
     */
    public maxResolution = 2000;

    /**
     * define the minWidth
     */
    public minWidth = 800;

    /**
     * Define the step of resolution changes
     */
    public resolutionChangeStep = 10;

    /**
     * Determine to use custom aspect ratios
     */
    public customAspectRatio: boolean;

    /**
     * regular expression to check for aspect ratio strings
     */
    private aspectRatioRe = RegExp('[1-9]+[0-9]*:[1-9]+[0-9]*');

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public projector: ViewProjector,
        private dialogRef: MatDialogRef<ProjectorEditDialogComponent>,
        private repo: ProjectorRepositoryService,
        private projectionDefaultRepo: ProjectionDefaultRepositoryService,
        private clockSlideService: ClockSlideService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, matSnackBar);

        if (projector) {
            this.previewProjector = new Projector(projector.getModel());

            if (!this.defaultAspectRatio.some(ratio => ratio === this.previewProjector.aspectRatio)) {
                this.customAspectRatio = true;
            }
        }

        this.updateForm = formBuilder.group({
            name: ['', Validators.required],
            aspectRatio: ['', [Validators.required, Validators.pattern(this.aspectRatioRe)]],
            width: [0, Validators.required],
            projectiondefaults_id: [[]],
            clock: [],
            color: ['', Validators.required],
            background_color: ['', Validators.required],
            header_background_color: ['', Validators.required],
            header_font_color: ['', Validators.required],
            header_h1_color: ['', Validators.required],
            chyron_background_color: ['', Validators.required],
            chyron_font_color: ['', Validators.required],
            show_header_footer: [],
            show_title: [],
            show_logo: []
        });

        // react to form changes
        this.subscriptions.push(
            this.updateForm.valueChanges.pipe(auditTime(100)).subscribe(() => {
                this.onChangeForm();
            })
        );
    }

    /**
     * Watches all projection defaults
     */
    public ngOnInit(): void {
        this.projectionDefaults = this.projectionDefaultRepo.getViewModelList();
        this.subscriptions.push(
            this.projectionDefaultRepo.getViewModelListObservable().subscribe(pds => (this.projectionDefaults = pds))
        );

        if (this.projector) {
            this.updateForm.patchValue(this.projector.projector);
            this.updateForm.patchValue({
                name: this.translate.instant(this.projector.name),
                clock: this.clockSlideService.isProjectedOn(this.projector),
                aspectRatio: this.projector.aspectRatio
            });
        }
    }

    /**
     * Apply changes and close the dialog
     */
    public async onSubmitProjector(): Promise<void> {
        await this.applyChanges();
        this.dialogRef.close(true);
    }

    /**
     * Saves the current changes on the projector
     */
    public async applyChanges(): Promise<void> {
        const updateProjector: Projector = new Projector();
        Object.assign(updateProjector, this.updateForm.value);
        try {
            await this.clockSlideService.setProjectedOn(this.projector, this.updateForm.value.clock);
            await this.repo.update(updateProjector, this.projector);
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * React to form changes to update the preview
     * @param previewUpdate
     */
    public onChangeForm(): void {
        if (this.previewProjector && this.projector && this.updateForm.valid) {
            Object.assign(this.previewProjector, this.updateForm.value);
            this.preview.setProjector(this.previewProjector);
            this.cd.markForCheck();
        }
    }

    /**
     * Resets the given form field to the given default.
     */
    public resetField(field: string): void {
        const patchValue = {};
        patchValue[field] = this.projector[field];
        this.updateForm.patchValue(patchValue);
    }

    /**
     * Sets the aspect Ratio to custom
     * @param event
     */
    public onCustomAspectRatio(event: boolean): void {
        this.customAspectRatio = event;
    }

    /**
     * Sets and validates custom aspect ratio values
     */
    public setCustomAspectRatio(): void {
        const formRatio = this.updateForm.get('aspectRatio').value;
        const validatedRatio = formRatio.match(this.aspectRatioRe);
        if (validatedRatio && validatedRatio[0]) {
            const ratio = validatedRatio[0];
            this.updateForm.get('aspectRatio').setValue(ratio);
        }
    }
}
