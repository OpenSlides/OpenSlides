import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { Projectable, ProjectorElementBuildDeskriptor, isProjectable } from 'app/site/base/projectable';
import { MatDialog } from '@angular/material';
import {
    ProjectionDialogComponent,
    ProjectionDialogReturnType
} from 'app/shared/components/projection-dialog/projection-dialog.component';
import { ProjectorService } from './projector.service';

/**
 * Manages the projection dialog. Projects the result of the user's choice.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectionDialogService extends OpenSlidesComponent {
    /**
     * Constructor.
     *
     * @param dialog
     * @param projectorService
     */
    public constructor(private dialog: MatDialog, private projectorService: ProjectorService) {
        super();
    }

    /**
     * Opens the projection dialog for the given projectable. After the user's choice,
     * the projectors will be updated.
     *
     * @param obj The projectable.
     */
    public async openProjectDialogFor(obj: Projectable | ProjectorElementBuildDeskriptor): Promise<void> {
        let descriptor: ProjectorElementBuildDeskriptor;
        if (isProjectable(obj)) {
            descriptor = obj.getSlide();
        } else {
            descriptor = obj;
        }

        const dialogRef = this.dialog.open<
            ProjectionDialogComponent,
            ProjectorElementBuildDeskriptor,
            ProjectionDialogReturnType
        >(ProjectionDialogComponent, {
            minWidth: '500px',
            maxHeight: '90vh',
            data: descriptor
        });
        const response = await dialogRef.afterClosed().toPromise();
        if (response) {
            const [projectors, projectorElement]: ProjectionDialogReturnType = response;
            this.projectorService.projectOnMultiple(projectors, projectorElement);
        }
    }
}
