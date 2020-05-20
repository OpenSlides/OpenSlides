import { Injectable } from '@angular/core';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewProjector } from '../models/view-projector';

/**
 * Handles the curent list of speakers slide. Manages the projection and provides
 * function to check, if it is projected. Handles the overlay and slide.
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentListOfSpeakersSlideService {
    public constructor(private projectorService: ProjectorService) {}

    /**
     * Returns the basic projector element for the CLOS slide. If overlay=True, the projector element
     * will be the overlay instead of the slide.
     *
     * @param overlay Wether to have a slide or overlay
     * @returns the identifiable CLOS projector element.
     */
    private getCurrentListOfSpeakersProjectorElement(overlay: boolean): IdentifiableProjectorElement {
        return {
            name: overlay ? 'agenda/current-list-of-speakers-overlay' : 'agenda/current-list-of-speakers',
            stable: overlay,
            getIdentifiers: () => ['name']
        };
    }

    /**
     * @returns the slide build descriptor for the overlay or slide
     */
    public getSlide(overlay: boolean): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => this.getCurrentListOfSpeakersProjectorElement(overlay),
            slideOptions: [],
            projectionDefaultName: 'agenda_current_list_of_speakers',
            getDialogTitle: () => 'Current list of speakers'
        };
    }

    /**
     * Queries, if the slide/overlay is projected on the given projector.
     *
     * @param projector The projector
     * @param overlay True, if we query for an overlay instead of the slide
     * @returns if the slide/overlay is projected on the projector
     */
    public isProjectedOn(projector: ViewProjector, overlay: boolean): boolean {
        return this.projectorService.isProjectedOn(
            this.getCurrentListOfSpeakersProjectorElement(overlay),
            projector.projector
        );
    }

    /**
     * Toggle the projection state of the slide/overlay on the given projector
     *
     * @param projector The projector
     * @param overlay Slide or overlay
     */
    public async toggleOn(projector: ViewProjector, overlay: boolean): Promise<void> {
        const isClosProjected = this.isProjectedOn(projector, overlay);
        if (isClosProjected) {
            await this.projectorService.removeFrom(
                projector.projector,
                this.getCurrentListOfSpeakersProjectorElement(overlay)
            );
        } else {
            await this.projectorService.projectOn(
                projector.projector,
                this.getCurrentListOfSpeakersProjectorElement(overlay)
            );
        }
    }
}
