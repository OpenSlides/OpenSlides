import { Component, OnInit, Input } from '@angular/core';
import { Projectable, ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ProjectionDialogService } from 'app/core/services/projection-dialog.service';

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
    public constructor(private projectionDialogService: ProjectionDialogService) {}

    /**
     * Initialization function
     */
    public ngOnInit(): void {}

    public onClick(event: Event): void {
        event.stopPropagation();
        this.projectionDialogService.openProjectDialogFor(this.object);
    }
}
