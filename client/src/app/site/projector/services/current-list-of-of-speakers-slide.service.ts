import { Injectable } from '@angular/core';
import { ProjectorService } from 'app/core/services/projector.service';
import { ViewProjector } from '../models/view-projector';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentListOfSpeakersSlideService {
    public constructor(private projectorService: ProjectorService) {}

    private getCurrentListOfSpeakersProjectorElement(overlay: boolean): IdentifiableProjectorElement {
        return {
            name: overlay ? 'agenda/current-list-of-speakers-overlay' : 'agenda/current-list-of-speakers',
            stable: overlay,
            getIdentifiers: () => ['name']
        };
    }

    public isProjectedOn(projector: ViewProjector, overlay: boolean): boolean {
        return this.projectorService.isProjectedOn(
            this.getCurrentListOfSpeakersProjectorElement(overlay),
            projector.projector
        );
    }

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
