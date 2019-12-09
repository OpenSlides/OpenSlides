import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ErrorService } from 'app/core/ui-services/error.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { largeDialogSettings } from 'app/shared/utils/dialog-settings';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ProjectorEditDialogComponent } from '../projector-edit-dialog/projector-edit-dialog.component';
import { ViewProjector } from '../../models/view-projector';

/**
 * List for all projectors.
 */
@Component({
    selector: 'os-projector-list-entry',
    templateUrl: './projector-list-entry.component.html',
    styleUrls: ['./projector-list-entry.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProjectorListEntryComponent extends BaseViewComponent implements OnInit {
    /**
     * The projector shown by this entry.
     */
    @Input()
    public set projector(value: ViewProjector) {
        this._projector = value;
    }

    public get projector(): ViewProjector {
        return this._projector;
    }

    private _projector: ViewProjector;

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
        errorService: ErrorService,
        private repo: ProjectorRepositoryService,
        private promptService: PromptService,
        private dialogService: MatDialog
    ) {
        super(titleService, translate, matSnackBar, errorService);
    }

    public ngOnInit(): void {}

    /**
     * Starts editing for the given projector.
     */
    public editProjector(): void {
        this.dialogService.open(ProjectorEditDialogComponent, {
            data: this.projector,
            ...largeDialogSettings
        });
    }

    /**
     * Handler to set the selected projector as CLOS reference
     */
    public onSetAsClosRef(): void {
        this.repo.setReferenceProjector(this.projector.id);
    }

    /**
     * Delete the projector.
     */
    public async onDeleteButton(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this projector?');
        if (await this.promptService.open(title, this.projector.name)) {
            this.repo.delete(this.projector).catch(this.raiseError);
        }
    }
}
