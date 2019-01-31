import { Component, OnInit, Input } from '@angular/core';

import {
    Projectable,
    ProjectorElementBuildDeskriptor,
    isProjectable,
    isProjectorElementBuildDeskriptor
} from 'app/site/base/projectable';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { ProjectionDialogService } from 'app/core/ui-services/projection-dialog.service';

/**
 * The projector button to project something on the projector.
 *
 * Use the input [object] to specify the object to project. It can either be
 * a Projectable or a ProjectorElementBuildDeskriptor
 */
@Component({
    selector: 'os-projector-button',
    templateUrl: './projector-button.component.html',
    styleUrls: ['./projector-button.component.scss']
})
export class ProjectorButtonComponent implements OnInit {
    /**
     * The object to project.
     */
    private _object: Projectable | ProjectorElementBuildDeskriptor;

    public get object(): Projectable | ProjectorElementBuildDeskriptor {
        return this._object;
    }

    @Input()
    public set object(obj: Projectable | ProjectorElementBuildDeskriptor) {
        if (isProjectable(obj) || isProjectorElementBuildDeskriptor(obj)) {
            this._object = obj;
        } else {
            console.error(
                'Your model for the projectorbutton is not projectable and not' + 'a projectorElementBuildDescriptor!',
                obj
            );
        }
    }

    /**
     * The constructor
     */
    public constructor(
        private projectionDialogService: ProjectionDialogService,
        private projectorService: ProjectorService
    ) {}

    /**
     * Initialization function
     */
    public ngOnInit(): void {}

    /**
     * Click on the projector button
     *
     * @param event  the click event
     */
    public onClick(event: Event): void {
        event.stopPropagation();
        this.projectionDialogService.openProjectDialogFor(this.object);
    }

    /**
     *
     *
     * @returns true, if the object is projected on one projector.
     */
    public isProjected(): boolean {
        if (!this.object) {
            return false;
        }
        return this.projectorService.isProjected(this.object);
    }
}
