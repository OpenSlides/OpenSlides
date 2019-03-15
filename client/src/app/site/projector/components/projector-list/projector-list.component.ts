import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatSnackBar, MatSelectChange } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ViewProjector } from '../../models/view-projector';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ClockSlideService } from '../../services/clock-slide.service';
import { OperatorService } from 'app/core/core-services/operator.service';

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
     * Helper to check manage permissions
     *
     * @returns true if the user can manage projectors
     */
    public get canManage(): boolean {
        return this.operator.hasPerms('core.can_manage_projector');
    }

    /**
     * Constructor. Initializes all forms.
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
        private operator: OperatorService
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
            background_color: ['', Validators.required],
            header_background_color: ['', Validators.required],
            header_font_color: ['', Validators.required],
            header_h1_color: ['', Validators.required],
            show_header_footer: [],
            show_title: [],
            show_logo: []
        });
    }

    /**
     * Watches all projectors.
     */
    public ngOnInit(): void {
        super.setTitle('Projectors');
        this.projectors = this.repo.getViewModelList();
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
            // TODO: the server shouldn't want to have element data..
            this.projectorToCreate.patchValues({
                elements: [{ name: 'core/clock', stable: true }],
                elements_preview: [],
                elements_history: [],
                reference_projector_id: this.projectors[0].reference_projector_id
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

        this.updateForm.patchValue(projector.projector);
        this.updateForm.patchValue({
            name: this.translate.instant(projector.name),
            aspectRatio: this.getAspectRatioKey(projector),
            clock: this.clockSlideService.isProjectedOn(projector)
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
        const updateProjector: Partial<Projector> = this.updateForm.value;
        updateProjector.height = Math.round(
            this.updateForm.value.width / aspectRatios[this.updateForm.value.aspectRatio]
        );

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
        const title = this.translate.instant('Are you sure you want to delete this projector?');
        const content = projector.name;
        if (await this.promptService.open(title, content)) {
            this.repo.delete(projector).then(null, this.raiseError);
        }
    }

    public onSelectReferenceProjector(change: MatSelectChange): void {
        const update: Partial<Projector> = {
            reference_projector_id: change.value
        };
        const promises = this.projectors.map(projector => {
            return this.repo.update(update, projector);
        });
        Promise.all(promises).then(null, this.raiseError);
    }
}
