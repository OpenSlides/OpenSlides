import { Component, OnInit, Input } from '@angular/core';

import {
    Projectable,
    ProjectorElementBuildDeskriptor,
    isProjectable,
    isProjectorElementBuildDeskriptor
} from 'app/site/base/projectable';
import { Projector } from 'app/shared/models/core/projector';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { ProjectionDialogService } from 'app/core/ui-services/projection-dialog.service';

/**
 * The projector button to project something on the projector.
 *
 * Use the input [object] to specify the object to project. It can either be
 * a Projectable or a ProjectorElementBuildDeskriptor
 *
 * For useage in menues set `menuItem=true`.
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
    private _object: Projectable | ProjectorElementBuildDeskriptor | null;

    public get object(): Projectable | ProjectorElementBuildDeskriptor {
        return this._object;
    }

    @Input()
    public set object(obj: Projectable | ProjectorElementBuildDeskriptor) {
        if (isProjectable(obj) || isProjectorElementBuildDeskriptor(obj)) {
            this._object = obj;
        } else {
            this.object = null;
        }
    }

    @Input()
    public text: string | null;

    @Input()
    public menuItem = false;

    /**
     * Pre-define projection target
     */
    @Input()
    public projector: Projector | null;

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
    public onClick(event?: Event): void {
        if (event) {
            event.stopPropagation();
        }
        if (this.object) {
            if (this.projector) {
                // if the projection target was defines before
                if (this.isProjected()) {
                    // remove the projected object
                    this.projectorService.removeFrom(this.projector, this.object);
                } else {
                    // instantly project the object
                    this.projectorService.projectOn(this.projector, this.object);
                }
            } else {
                // open the projection dialog
                this.projectionDialogService.openProjectDialogFor(this.object);
            }
        }
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

        return this.projector
            ? this.projectorService.isProjectedOn(this.object, this.projector)
            : this.projectorService.isProjected(this.object);
    }
}
