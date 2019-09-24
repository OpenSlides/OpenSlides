import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ProjectionDialogService } from 'app/core/ui-services/projection-dialog.service';
import { Projector } from 'app/shared/models/core/projector';
import {
    isProjectable,
    isProjectorElementBuildDeskriptor,
    Projectable,
    ProjectorElementBuildDeskriptor
} from 'app/site/base/projectable';

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
export class ProjectorButtonComponent implements OnInit, OnDestroy {
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
            this._object = null;
        }
    }

    @Input()
    public text: string | null;

    @Input()
    public menuItem = false;

    @Output()
    public changeEvent: EventEmitter<void> = new EventEmitter();

    /**
     * Pre-define projection target
     */
    @Input()
    public projector: Projector | null;

    private projectorRepoSub: Subscription;

    /**
     * The constructor
     */
    public constructor(
        private projectorRepo: ProjectorRepositoryService,
        private projectionDialogService: ProjectionDialogService,
        private projectorService: ProjectorService
    ) {}

    /**
     * Initialization function
     */
    public ngOnInit(): void {
        this.projectorRepoSub = this.projectorRepo
            .getGeneralViewModelObservable()
            .pipe(distinctUntilChanged())
            .subscribe(() => {
                this.changeEvent.next();
            });
    }

    public ngOnDestroy(): void {
        if (this.projectorRepoSub) {
            this.projectorRepoSub.unsubscribe();
            this.projectorRepoSub = null;
        }
    }

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
                if (this.checkIsProjected()) {
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
    public checkIsProjected(): boolean {
        if (!this.object) {
            return false;
        }

        return this.projector
            ? this.projectorService.isProjectedOn(this.object, this.projector)
            : this.projectorService.isProjected(this.object);
    }
}
