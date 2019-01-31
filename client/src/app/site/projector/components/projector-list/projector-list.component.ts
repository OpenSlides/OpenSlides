import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService } from '../../services/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { PromptService } from 'app/core/services/prompt.service';
import { ClockSlideService } from '../../services/clock-slide.service';

/**
 * All supported aspect rations for projectors.
 */
const aspectRatios: { [ratio: string]: number } = {
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '16:10': 16 / 10
};

/**
 * List for all projectors.
 */
@Component({
    selector: 'os-projector-list',
    templateUrl: './projector-list.component.html',
    styleUrls: ['./projector-list.component.scss']
})
export class ProjectorListComponent extends BaseViewComponent implements OnInit {
    /**
     * This member is set, if the user is creating a new projector.
     */
    public projectorToCreate: Projector | null;

    /**
     * The create form.
     */
    public createForm: FormGroup;

    /**
     * The update form. Will be refreahed for each projector. Just one update
     * form can be shown per time.
     */
    public updateForm: FormGroup;

    /**
     * The id of the currently edited projector.
     */
    public editId: number | null = null;

    /**
     * All aspect ratio keys/strings for the UI.
     */
    public aspectRatiosKeys: string[];

    /**
     * All projectors.
     */
    public projectors: ViewProjector[];

    /**
     * Constructor. Initializes all forms.
     *
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: ProjectorRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private clockSlideService: ClockSlideService
    ) {
        super(titleService, translate, matSnackBar);

        this.aspectRatiosKeys = Object.keys(aspectRatios);

        this.createForm = this.formBuilder.group({
            name: ['', Validators.required]
        });
        this.updateForm = this.formBuilder.group({
            name: ['', Validators.required],
            aspectRatio: ['', Validators.required],
            width: [0, Validators.required],
            clock: [true],
            reference_projector_id: []
        });
    }

    /**
     * Watches all projectors.
     */
    public ngOnInit(): void {
        super.setTitle('Projectors');
        this.repo.getViewModelListObservable().subscribe(projectors => (this.projectors = projectors));
    }

    /**
     * Opens the create form.
     */
    public onPlusButton(): void {
        if (!this.projectorToCreate) {
            this.projectorToCreate = new Projector();
            this.createForm.setValue({ name: '' });
        }
    }

    /**
     * Creates the comment section from the create form.
     */
    public create(): void {
        if (this.createForm.valid && this.projectorToCreate) {
            this.projectorToCreate.patchValues(this.createForm.value as Projector);
            // TODO: the server shouldn't want to have this data..
            this.projectorToCreate.patchValues({
                elements: [{ name: 'core/clock', stable: true }],
                elements_preview: [],
                elements_history: []
            });
            this.repo.create(this.projectorToCreate).then(() => (this.projectorToCreate = null), this.raiseError);
        }
    }

    /**
     * Event on Key Down in update or create form.
     *
     * @param event the keyboard event
     * @param the current view in scope
     */
    public keyDownFunction(event: KeyboardEvent, projector?: ViewProjector): void {
        if (event.key === 'Enter' && event.shiftKey) {
            if (projector) {
                this.onSaveButton(projector);
            } else {
                this.create();
            }
        }
        if (event.key === 'Escape') {
            if (projector) {
                this.onCancelButton(projector);
            } else {
                this.projectorToCreate = null;
            }
        }
    }

    /**
     * Calculates the aspect ratio of the given projector.
     * If no matching ratio is found, the first ratio is returned.
     *
     * @param projector The projector to check
     * @returns the found ratio key.
     */
    public getAspectRatioKey(projector: ViewProjector): string {
        const ratio = projector.width / projector.height;
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
     *
     * @param projector The projector to edit
     */
    public onEditButton(projector: ViewProjector): void {
        if (this.editId !== null) {
            return;
        }
        this.editId = projector.id;
        this.updateForm.reset();

        const reference_projector_id = projector.reference_projector_id
            ? projector.reference_projector_id
            : projector.id;
        this.updateForm.patchValue({
            name: projector.name,
            aspectRatio: this.getAspectRatioKey(projector),
            width: projector.width,
            clock: this.clockSlideService.isProjectedOn(projector),
            reference_projector_id: reference_projector_id
        });
    }

    /**
     * Cancels the current editing.
     * @param projector the projector
     */
    public onCancelButton(projector: ViewProjector): void {
        if (projector.id !== this.editId) {
            return;
        }
        this.editId = null;
    }

    /**
     * Saves the projector
     *
     * @param projector The projector to save.
     */
    public async onSaveButton(projector: ViewProjector): Promise<void> {
        if (projector.id !== this.editId || !this.updateForm.valid) {
            return;
        }
        const updateProjector: Partial<Projector> = {
            name: this.updateForm.value.name,
            width: this.updateForm.value.width,
            height: Math.round(this.updateForm.value.width / aspectRatios[this.updateForm.value.aspectRatio]),
            reference_projector_id: this.updateForm.value.reference_projector_id
        };
        try {
            await this.clockSlideService.setProjectedOn(projector, this.updateForm.value.clock);
            await this.repo.update(updateProjector, projector);
            this.editId = null;
        } catch (e) {
            this.raiseError(e);
        }
    }

    /**
     * Delete the projector.
     *
     * @param projector The projector to delete
     */
    public async onDeleteButton(projector: ViewProjector): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${projector.name}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(projector).then(null, this.raiseError);
        }
    }

    /**
     * Get all available reference projectors for the given projector. These
     * projectors are all existing projectors exluding the given projector
     *
     * @returns all available reference projectors
     */
    public getReferenceProjectorsFor(projector: ViewProjector): ViewProjector[] {
        return this.repo.getViewModelList().filter(p => p.id !== projector.id);
    }
}
