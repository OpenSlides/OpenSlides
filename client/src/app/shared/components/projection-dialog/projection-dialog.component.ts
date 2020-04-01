import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DataStoreService } from 'app/core/core-services/data-store.service';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { IdentifiableProjectorElement, Projector } from 'app/shared/models/core/projector';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import {
    isSlideChoiceOption,
    isSlideDecisionOption,
    SlideChoiceOption,
    SlideDecisionOption,
    SlideOption,
    SlideOptions
} from 'app/site/base/slide-options';

export type ProjectionDialogReturnType = ['project' | 'addToPreview', Projector[], IdentifiableProjectorElement];

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
    public optionValues: object = {};
    public options: SlideOptions;

    public constructor(
        public dialogRef: MatDialogRef<ProjectionDialogComponent, ProjectionDialogReturnType>,
        @Inject(MAT_DIALOG_DATA) public projectorElementBuildDescriptor: ProjectorElementBuildDeskriptor,
        private DS: DataStoreService,
        private projectorService: ProjectorService
    ) {
        this.projectors = this.DS.getAll<Projector>('core/projector');
        // TODO: Maybe watch. But this may not be necessary for the short living time of this dialog.

        if (projectorElementBuildDescriptor) {
            this.selectedProjectors = this.projectorService.getProjectorsWhichAreProjecting(
                this.projectorElementBuildDescriptor
            );

            // Add default projector, if the projectable is not projected on it.
            if (this.projectorElementBuildDescriptor.projectionDefaultName) {
                const defaultProjector: Projector = this.projectorService.getProjectorForDefault(
                    this.projectorElementBuildDescriptor.projectionDefaultName
                );
                if (defaultProjector && !this.selectedProjectors.includes(defaultProjector)) {
                    this.selectedProjectors.push(defaultProjector);
                }
            }

            // Set option defaults
            this.projectorElementBuildDescriptor.slideOptions.forEach(option => {
                this.optionValues[option.key] = option.default;
            });

            this.options = this.projectorElementBuildDescriptor.slideOptions;
        }
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
        return this.projectorService.isProjectedOn(this.projectorElementBuildDescriptor, projector);
    }

    public isDecisionOption(option: SlideOption): option is SlideDecisionOption {
        return isSlideDecisionOption(option);
    }

    public isChoiceOption(option: SlideOption): option is SlideChoiceOption {
        return isSlideChoiceOption(option);
    }

    public onProject(): void {
        let element = this.projectorElementBuildDescriptor.getBasicProjectorElement(this.optionValues);
        element = { ...element, ...this.optionValues };
        this.dialogRef.close(['project', this.selectedProjectors, element]);
    }

    public onAddToPreview(): void {
        let element = this.projectorElementBuildDescriptor.getBasicProjectorElement(this.optionValues);
        element = { ...element, ...this.optionValues };
        this.dialogRef.close(['addToPreview', this.selectedProjectors, element]);
    }

    public onCancel(): void {
        this.dialogRef.close();
    }
}
