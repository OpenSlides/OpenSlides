import { Component, OnInit, Input } from '@angular/core';

import { Projectable, ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ProjectionDialogService } from 'app/core/services/projection-dialog.service';
import { ProjectorService } from '../../../core/services/projector.service';

/**
 */
@Component({
    selector: 'os-projector-button',
    templateUrl: './projector-button.component.html',
    styleUrls: ['./projector-button.component.scss']
})
export class ProjectorButtonComponent implements OnInit {
    @Input()
    public object: Projectable | ProjectorElementBuildDeskriptor;

    /**
     * The consotructor
     */
    public constructor(
        private projectionDialogService: ProjectionDialogService,
        private projectorService: ProjectorService
    ) {}

    /**
     * Initialization function
     */
    public ngOnInit(): void {}

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
        if (this.object) {
            return this.projectorService.isProjected(this.object);
        } else {
            return false;
        }
    }
}
