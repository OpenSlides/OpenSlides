import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Projectable } from 'app/site/base/projectable';
import { DataStoreService } from 'app/core/services/data-store.service';
import { Projector, ProjectorElement } from 'app/shared/models/core/projector';
import { ProjectorService } from 'app/core/services/projector.service';
import {
    ProjectorOption,
    isProjectorDecisionOption,
    isProjectorChoiceOption,
    ProjectorDecisionOption,
    ProjectorChoiceOption,
    ProjectorOptions
} from 'app/site/base/projector-options';

export type ProjectionDialogReturnType = [Projector[], ProjectorElement];

/**
 */
@Component({
    selector: 'os-projection-dialog',
    templateUrl: './projection-dialog.component.html',
    styleUrls: ['./projection-dialog.component.scss']
})
export class ProjectionDialogComponent {
    public projectors: Projector[];
    private selectedProjectors: Projector[] = [];
    public projectorElement: ProjectorElement;
    public options: ProjectorOptions;

    public constructor(
        public dialogRef: MatDialogRef<ProjectionDialogComponent, ProjectionDialogReturnType>,
        @Inject(MAT_DIALOG_DATA) public projectable: Projectable,
        private DS: DataStoreService,
        private projectorService: ProjectorService
    ) {
        this.projectors = this.DS.getAll<Projector>('core/projector');
        // TODO: Maybe watch. But this may not be necessary for the short living time of this dialog.

        this.selectedProjectors = this.projectorService.getProjectorsWhichAreProjecting(this.projectable);

        // Add default projector, if the projectable is not projected on it.
        const defaultProjector: Projector = this.projectorService.getProjectorForDefault(
            this.projectable.getProjectionDefaultName()
        );
        if (!this.selectedProjectors.includes(defaultProjector)) {
            this.selectedProjectors.push(defaultProjector);
        }

        this.projectorElement = {
            id: this.projectable.getIdForSlide(),
            name: this.projectable.getNameForSlide(),
            stable: this.projectable.isStableSlide()
        };

        // Set option defaults
        this.projectable.getProjectorOptions().forEach(option => {
            this.projectorElement[option.key] = option.default;
        });

        this.options = this.projectable.getProjectorOptions();
    }

    public toggleProjector(projector: Projector): void {
        const index = this.selectedProjectors.indexOf(projector);
        if (index < 0) {
            this.selectedProjectors.push(projector);
        } else {
            this.selectedProjectors.splice(index, 1);
        }
    }

    public isProjectorSelected(projector: Projector): boolean {
        return this.selectedProjectors.includes(projector);
    }

    public isProjectedOn(projector: Projector): boolean {
        return this.projectorService.isProjectedOn(this.projectable, projector);
    }

    public isDecisionOption(option: ProjectorOption): option is ProjectorDecisionOption {
        return isProjectorDecisionOption(option);
    }

    public isChoiceOption(option: ProjectorOption): option is ProjectorChoiceOption {
        return isProjectorChoiceOption(option);
    }

    public onOk(): void {
        this.dialogRef.close([this.selectedProjectors, this.projectorElement]);
    }

    public onCancel(): void {
        this.dialogRef.close();
    }
}
