import { Injectable } from '@angular/core';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';
import { ViewProjector } from '../models/view-projector';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class ClockSlideService {
    public constructor(private projectorService: ProjectorService) {}

    private getClockProjectorElement(): IdentifiableProjectorElement {
        return {
            name: 'core/clock',
            stable: true,
            getIdentifiers: () => ['name']
        };
    }

    public isProjectedOn(projector: ViewProjector): boolean {
        return this.projectorService.isProjectedOn(this.getClockProjectorElement(), projector.projector);
    }

    public async setProjectedOn(projector: ViewProjector, show: boolean): Promise<void> {
        const isClockProjected = this.isProjectedOn(projector);
        if (show && !isClockProjected) {
            await this.projectorService.projectOn(projector.projector, this.getClockProjectorElement());
        } else if (!show && isClockProjected) {
            await this.projectorService.removeFrom(projector.projector, this.getClockProjectorElement());
        }
    }
}
