import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSliderChange } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ClockSlideService } from '../../services/clock-slide.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ViewProjectionDefault } from '../../models/view-projection-default';
import { ProjectionDefaultRepositoryService } from 'app/core/repositories/projector/projection-default-repository.service';
import { MatRadioChange } from '@angular/material';

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
 * List for all projectors.
 */
@Component({
    selector: 'os-projector-list-entry',
    templateUrl: './projector-list-entry.component.html',
    styleUrls: ['./projector-list-entry.component.scss']
})
export class ProjectorListEntryComponent extends BaseViewComponent implements OnInit {
    /**
     * The update form. Will be refreahed for each projector. Just one update
     * form can be shown per time.
     */
    public updateForm: FormGroup;

    /**
     * Saves, if this projector currently is edited.
     */
    public isEditing = false;

    /**
     * All ProjectionDefaults to select from.
     */
    public projectionDefaults: ViewProjectionDefault[];

    /**
     * All aspect ratio keys/strings for the UI.
     */
    public aspectRatiosKeys: string[];

    /**
     * The projector shown by this entry.
     */
    @Input()
    public set projector(value: ViewProjector) {
        this._projector = value;
        this.updateForm.patchValue({ width: value.width });
    }

    public get projector(): ViewProjector {
        return this._projector;
    }

    private _projector: ViewProjector;

    /**
     * Helper to check manage permissions
     *
     * @returns true if the user can manage projectors
     */
    public get canManage(): boolean {
        return this.operator.hasPerms('core.can_manage_projector');
    }

    /**
     * Constructor. Initializes the update form.
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     * @param clockSlideService
     * @param operator OperatorService
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService, // protected required for ng-translate-extract
        matSnackBar: MatSnackBar,
        private repo: ProjectorRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private clockSlideService: ClockSlideService,
        private operator: OperatorService,
        private projectionDefaultRepo: ProjectionDefaultRepositoryService
    ) {
        super(titleService, translate, matSnackBar);

        this.aspectRatiosKeys = Object.keys(aspectRatios);

        this.updateForm = this.formBuilder.group({
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
    }

    /**
     * Watches all projectiondefaults.
     */
    public ngOnInit(): void {
        this.projectionDefaults = this.projectionDefaultRepo.getViewModelList();
        this.subscriptions.push(
            this.projectionDefaultRepo.getViewModelListObservable().subscribe(pds => (this.projectionDefaults = pds))
        );
    }

    /**
     * Event on Key Down in update form.
     *
     * @param event the keyboard event
     * @param the current view in scope
     */
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.onSaveButton();
        }
        if (event.key === 'Escape') {
            this.onCancelButton();
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

    /**
     * Starts editing for the given projector.
     */
    public onEditButton(): void {
        if (this.isEditing) {
            return;
        }
        this.isEditing = true;
        this.updateForm.reset();

        this.updateForm.patchValue(this.projector.projector);
        this.updateForm.patchValue({
            name: this.translate.instant(this.projector.name),
            aspectRatio: this.getAspectRatioKey(),
            clock: this.clockSlideService.isProjectedOn(this.projector)
        });
    }

    /**
     * Cancels the current editing.
     */
    public onCancelButton(): void {
        this.isEditing = false;
    }

    /**
     * Saves the projector
     *
     * @param projector The projector to save.
     */
    public async onSaveButton(): Promise<void> {
        const updateProjector: Partial<Projector> = this.updateForm.value;
        updateProjector.height = Math.round(
            this.updateForm.value.width / aspectRatios[this.updateForm.value.aspectRatio]
        );

        try {
            await this.clockSlideService.setProjectedOn(this.projector, this.updateForm.value.clock);
            await this.repo.update(updateProjector, this.projector);
            this.isEditing = false;
        } catch (e) {
            this.raiseError(e);
        }
    }

    public aspectRatioChanged(event: MatRadioChange): void {
        let width: number;
        if (event.value === '30:9' && this.updateForm.value.width < aspectRatio_30_9_MinWidth) {
            width = aspectRatio_30_9_MinWidth;
        } else {
            width = this.updateForm.value.width;
        }
        this.updateProjectorDimensions(width, event.value);
    }

    public getMinWidth(): number {
        if (this.updateForm.value.aspectRatio === '30:9') {
            return aspectRatio_30_9_MinWidth;
        } else {
            return 800;
        }
    }

    /**
     * Delete the projector.
     */
    public async onDeleteButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this projector?');
        if (await this.promptService.open(title, this.projector.name)) {
            this.repo.delete(this.projector).then(null, this.raiseError);
        }
    }

    /**
     * Eventhandler for slider changes. Directly saves the new aspect ratio.
     *
     * @param event The slider value
     */
    public widthSliderValueChanged(event: MatSliderChange): void {
        this.updateProjectorDimensions(event.value, this.updateForm.value.aspectRatio);
    }

    private updateProjectorDimensions(width: number, aspectRatioKey: string): void {
        const updateProjector: Partial<Projector> = {
            width: width
        };
        updateProjector.height = Math.round(width / aspectRatios[aspectRatioKey]);
        this.repo.update(updateProjector, this.projector).then(null, this.raiseError);
    }

    /**
     * Resets the given form field to the given default.
     */
    public resetField(field: string, value: string): void {
        const patchValue = {};
        patchValue[field] = value;
        this.updateForm.patchValue(patchValue);
    }
}
