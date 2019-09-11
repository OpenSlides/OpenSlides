import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { timer } from 'rxjs';

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
    styleUrls: ['./projector-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ProjectorListComponent extends BaseViewComponent implements OnInit, AfterViewInit, OnDestroy {
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
        private operator: OperatorService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, matSnackBar);

        this.createForm = this.formBuilder.group({
            name: ['', Validators.required]
        });

        /**
         * Angulars change detection goes nuts, since countdown and motios with long texts are pushing too much data
         */
        this.subscriptions.push(
            timer(0, 1000).subscribe(() => {
                this.cd.detectChanges();
            })
        );
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
     * Initial change detection
     */
    public ngAfterViewInit(): void {
        this.cd.detectChanges();
    }

    /**
     * implicitly Destroy the timer sub and detach the CD
     */
    public ngOnDestroy(): void {
        super.ngOnDestroy();
        this.cd.detach();
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
            this.repo.create(this.projectorToCreate).then(() => {
                this.projectorToCreate = null;
                this.cd.detectChanges();
            }, this.raiseError);
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
