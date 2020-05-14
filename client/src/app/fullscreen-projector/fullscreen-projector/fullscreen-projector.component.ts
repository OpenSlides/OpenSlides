import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';

import { AuthService } from 'app/core/core-services/auth.service';
import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ViewProjector } from 'app/site/projector/models/view-projector';
import { Size } from 'app/site/projector/size';

/**
 * The fullscreen projector. Bootstraps OpenSlides, gets the requested projector,
 * holds the projector component and fits it to the screen.
 *
 * DO NOT use this component in the site!
 */
@Component({
    selector: 'os-fullscreen-projector',
    templateUrl: './fullscreen-projector.component.html',
    styleUrls: ['./fullscreen-projector.component.scss']
})
export class FullscreenProjectorComponent implements OnInit {
    // TODO: isLoading, canSeeProjector and other issues must be displayed!
    public isLoading = true;
    public canSeeProjector = false;

    /**
     * The id of the projector given by the url.
     */
    public projectorId: number;

    /**
     * The projector from the datastore.
     */
    public projector: ViewProjector | null;

    /**
     * Saves the projectorsize. It's used to check, if the size has changed
     * on a projector update.
     */
    private oldProjectorSize: Size = { width: 0, height: 0 };

    /**
     * This subject fires, if the container changes it's size.
     */
    public resizeSubject = new Subject<void>();

    /**
     * Used to give the projector the right size.
     */
    public projectorStyle = {
        width: '100px' // Some default. Will be overwritten soon.
    };

    /**
     * The container to get the window size.
     */
    @ViewChild('container', { static: true })
    private containerElement: ElementRef;

    /**
     * Constructor. Updates the projector dimensions on a resize.
     *
     * @param auth
     * @param route
     * @param operator
     * @param repo
     */
    public constructor(
        auth: AuthService, // Needed tro trigger loading of OpenSlides. Starts the Bootup process.
        private route: ActivatedRoute,
        private operator: OperatorService,
        private repo: ProjectorRepositoryService
    ) {
        this.resizeSubject.subscribe(() => {
            this.updateProjectorDimensions();
        });
    }

    /**
     * Get the projector id from the URL. Loads the projector.
     * Subscribes to the operator to get his/her permissions.
     */
    public ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.loadProjector(parseInt(params.id, 10) || 1);
            this.isLoading = false;
        });

        this.operator.getUserObservable().subscribe(() => {
            this.canSeeProjector = this.operator.hasPerms(Permission.coreCanSeeProjector);
        });
    }

    /**
     * Loads the projector.
     *
     * @param projectorId: The projector id for the projector to load.
     */
    private loadProjector(projectorId: number): void {
        this.projectorId = projectorId;
        // TODO: what happens on delete?

        // Watches the projector. Update the container size, if the projector size changes.
        this.repo.getViewModelObservable(this.projectorId).subscribe(projector => {
            this.projector = projector;
            if (
                projector &&
                (projector.width !== this.oldProjectorSize.width || projector.height !== this.oldProjectorSize.height)
            ) {
                this.oldProjectorSize.width = projector.height;
                this.oldProjectorSize.height = projector.height;
                this.updateProjectorDimensions();
            }
        });
    }

    /**
     * Fits the projector into the container.
     */
    private updateProjectorDimensions(): void {
        if (!this.containerElement || !this.projector) {
            return;
        }
        const projectorAspectRatio = this.projector.width / this.projector.height;
        const windowAspectRatio =
            this.containerElement.nativeElement.offsetWidth / this.containerElement.nativeElement.offsetHeight;

        if (projectorAspectRatio >= windowAspectRatio) {
            // full width
            this.projectorStyle.width = `${this.containerElement.nativeElement.offsetWidth}px`;
        } else {
            // full height
            const width = Math.floor(this.containerElement.nativeElement.offsetHeight * projectorAspectRatio);
            this.projectorStyle.width = `${width}px`;
        }
    }
}
