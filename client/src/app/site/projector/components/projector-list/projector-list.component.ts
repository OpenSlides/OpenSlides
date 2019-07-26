import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { Projector } from 'app/shared/models/core/projector';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewProjector } from '../../models/view-projector';

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
        private operator: OperatorService
    ) {
        super(titleService, translate, matSnackBar);

        this.createForm = this.formBuilder.group({
            name: ['', Validators.required]
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
            this.projectorToCreate.patchValues({
                reference_projector_id: this.projectors[0].reference_projector_id
            });
            this.repo.create(this.projectorToCreate).then(() => (this.projectorToCreate = null), this.raiseError);
        }
    }

    /**
     * Event on Key Down in update or create form.
     *
     * @param event the keyboard event
     */
    public keyDownFunction(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.create();
        }
        if (event.key === 'Escape') {
            this.projectorToCreate = null;
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
