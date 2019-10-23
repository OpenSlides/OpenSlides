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
import { MAT_DIALOG_DATA, MatDialogRef, MatRadioChange, MatSnackBar } from '@angular/material';
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
 * All supported aspect rations for projectors.
 */
const aspectRatios: { [ratio: string]: number } = {
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '16:10': 16 / 10,
    '30:9': 30 / 9
};

const aspectRatio_30_9_MinWidth = 1150;

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
    @ViewChild('preview', { static: false })
    public preview: ProjectorComponent;

    /**
     * The update form. Will be refreahed for each projector. Just one update
     * form can be shown per time.
     */
    public updateForm: FormGroup;

    /**
     * All aspect ratio keys/strings for the UI.
     */
    public aspectRatiosKeys: string[];

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
     * Define the step of resolution changes
     */
    public resolutionChangeStep = 10;

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
        this.aspectRatiosKeys = Object.keys(aspectRatios);

        if (projector) {
            this.previewProjector = new Projector(projector.getModel());
        }

        this.updateForm = formBuilder.group({
            name: ['', Validators.required],
            aspectRatio: ['', Validators.required],
            width: [0, Validators.required],
            projectiondefaults_id: [[]],
            clock: [true],
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
                aspectRatio: this.getAspectRatioKey(),
                clock: this.clockSlideService.isProjectedOn(this.projector)
            });

            this.subscriptions.push(
                this.repo.getViewModelObservable(this.projector.id).subscribe(update => {
                    // patches the projector with updated values
                    const projectorPatch = {};
                    Object.keys(this.updateForm.controls).forEach(ctrl => {
                        if (update[ctrl]) {
                            projectorPatch[ctrl] = update[ctrl];
                        }
                    });
                    this.updateForm.patchValue(projectorPatch);
                })
            );
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
        const updateProjector: Partial<Projector> = this.updateForm.value;
        updateProjector.height = this.calcHeight(this.updateForm.value.width, this.updateForm.value.aspectRatio);
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
        if (this.previewProjector && this.projector) {
            Object.assign(this.previewProjector, this.updateForm.value);
            this.previewProjector.height = this.calcHeight(
                this.updateForm.value.width,
                this.updateForm.value.aspectRatio
            );
            this.preview.setProjector(this.previewProjector);
            this.cd.markForCheck();
        }
    }

    /**
     * Helper to calc height
     * @param width
     * @param aspectRatio
     */
    private calcHeight(width: number, aspectRatio: string): number {
        return Math.round(width / aspectRatios[aspectRatio]);
    }

    /**
     * Resets the given form field to the given default.
     */
    public resetField(field: string): void {
        const patchValue = {};
        patchValue[field] = this.projector[field];
        this.updateForm.patchValue(patchValue);
    }

    public aspectRatioChanged(event: MatRadioChange): void {
        let width: number;
        if (event.value === '30:9' && this.updateForm.value.width < aspectRatio_30_9_MinWidth) {
            width = aspectRatio_30_9_MinWidth;
        } else {
            width = this.updateForm.value.width;
        }
    }

    /**
     * Calculates the aspect ratio of the given projector.
     * If no matching ratio is found, the first ratio is returned.
     *
     * @param projector The projector to check
     * @returns the found ratio key.
     */
    public getAspectRatioKey(): string {
        const ratio = this.projector.width / this.projector.height;
        const RATIO_ENVIRONMENT = 0.05;
        const foundRatioKey = Object.keys(aspectRatios).find(key => {
            const value = aspectRatios[key];
            return value >= ratio - RATIO_ENVIRONMENT && value <= ratio + RATIO_ENVIRONMENT;
        });
        if (!foundRatioKey) {
            return Object.keys(aspectRatios)[0];
        } else {
            return foundRatioKey;
        }
    }

    public getMinWidth(): number {
        if (this.updateForm.value.aspectRatio === '30:9') {
            return aspectRatio_30_9_MinWidth;
        } else {
            return 800;
        }
    }
}
