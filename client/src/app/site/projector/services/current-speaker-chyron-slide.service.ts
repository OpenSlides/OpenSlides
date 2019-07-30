import { Injectable } from '@angular/core';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';
import { ViewProjector } from '../models/view-projector';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentSpeakerChyronSlideService {
    public constructor(private projectorService: ProjectorService) {}

    /**
     * Returns the basic projector element for the chyron slide
     *
     * @returns the identifiable chyron projector element.
     */
    private getCurrentSpeakerChyronProjectorElement(): IdentifiableProjectorElement {
        return {
            name: 'agenda/current-speaker-chyron',
            stable: true,
            getIdentifiers: () => ['name']
        };
    }

    /**
     * Queries, if the slide is projected on the given projector.
     *
     * @param projector The projector
     * @returns if the slide is projected on the projector
     */
    public isProjectedOn(projector: ViewProjector): boolean {
        return this.projectorService.isProjectedOn(this.getCurrentSpeakerChyronProjectorElement(), projector.projector);
    }

    /**
     * Toggle the projection state of the slide on the given projector
     *
     * @param projector The projector
     */
    public async toggleOn(projector: ViewProjector): Promise<void> {
        const isClosProjected = this.isProjectedOn(projector);
        if (isClosProjected) {
            await this.projectorService.removeFrom(projector.projector, this.getCurrentSpeakerChyronProjectorElement());
        } else {
            await this.projectorService.projectOn(projector.projector, this.getCurrentSpeakerChyronProjectorElement());
        }
    }
}
