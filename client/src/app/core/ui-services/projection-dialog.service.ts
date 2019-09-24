import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import {
    ProjectionDialogComponent,
    ProjectionDialogReturnType
} from 'app/shared/components/projection-dialog/projection-dialog.component';
import { isProjectable, Projectable, ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ConfigService } from './config.service';
import { ProjectorService } from '../core-services/projector.service';

/**
 * Manages the projection dialog. Projects the result of the user's choice.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectionDialogService {
    /**
     * Constructor.
     *
     * @param dialog
     * @param projectorService
     */
    public constructor(
        private dialog: MatDialog,
        private projectorService: ProjectorService,
        private configService: ConfigService
    ) {}

    /**
     * Opens the projection dialog for the given projectable. After the user's choice,
     * the projectors will be updated.
     *
     * @param obj The projectable.
     */
    public async openProjectDialogFor(obj: Projectable | ProjectorElementBuildDeskriptor): Promise<object> {
        let descriptor: ProjectorElementBuildDeskriptor;
        if (isProjectable(obj)) {
            descriptor = obj.getSlide(this.configService);
        } else {
            descriptor = obj;
        }
        const dialogRef = this.dialog.open<
            ProjectionDialogComponent,
            ProjectorElementBuildDeskriptor,
            ProjectionDialogReturnType
        >(ProjectionDialogComponent, {
            maxHeight: '90vh',
            autoFocus: false,
            data: descriptor
        });
        const response = await dialogRef.afterClosed().toPromise();
        if (response) {
            const [action, projectors, projectorElement]: ProjectionDialogReturnType = response;
            if (action === 'project') {
                this.projectorService.projectOnMultiple(projectors, projectorElement);
                return { fullscreen: projectorElement.fullscreen, displayType: projectorElement.displayType };
            } else if (action === 'addToPreview') {
                projectors.forEach(projector => {
                    this.projectorService.addElementToPreview(projector, projectorElement);
                });
                return null;
            }
        }
    }
}
