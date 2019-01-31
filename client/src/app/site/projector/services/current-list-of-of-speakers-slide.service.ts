import { Injectable } from '@angular/core';
import { ProjectorService } from 'app/core/core-services/projector.service';
import { ViewProjector } from '../models/view-projector';
import { IdentifiableProjectorElement } from 'app/shared/models/core/projector';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { AgendaBaseModel } from 'app/shared/models/base/agenda-base-model';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentListOfSpeakersSlideService {
    private currentItemIds: { [projectorId: number]: BehaviorSubject<number | null> } = {};

    public constructor(
        private projectorService: ProjectorService,
        private projectorRepo: ProjectorRepositoryService,
        private slideManager: SlideManager
    ) {
        this.projectorRepo.getGeneralViewModelObservable().subscribe(projector => {
            const itemId = this.getCurrentAgendaItemIdForProjector(projector);
            if (this.currentItemIds[projector.id]) {
                this.currentItemIds[projector.id].next(itemId);
            }
        });
    }

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
     * Returns an observable for the agenda item id of the currently projected element on the
     * given projector.
     *
     * @param projector The projector to observe.
     * @returns An observalbe for the agenda item id. Null, if no element with an agenda item is shown.
     */
    public getAgendaItemIdObservable(projector: ViewProjector): Observable<number | null> {
        if (!this.currentItemIds[projector.id]) {
            const itemId = this.getCurrentAgendaItemIdForProjector(projector);
            this.currentItemIds[projector.id] = new BehaviorSubject<number | null>(itemId);
        }
        return this.currentItemIds[projector.id].asObservable();
    }

    /**
     * Tries to get the agenda item id for one non stable element on the projector.
     *
     * @param projector The projector
     * @returns The agenda item id or null, if there is no such projector element.
     */
    private getCurrentAgendaItemIdForProjector(projector: ViewProjector): number | null {
        const nonStableElements = projector.elements.filter(element => !element.stable);
        if (nonStableElements.length > 0) {
            const nonStableElement = this.slideManager.getIdentifialbeProjectorElement(nonStableElements[0]); // The normal case is just one non stable slide
            try {
                const model = this.projectorService.getModelFromProjectorElement(nonStableElement);
                if (model instanceof AgendaBaseModel) {
                    // TODO: Use repositories associated to models
                    return (<any>model).agenda_item_id;
                }
            } catch (e) {
                // make TypeScript silent.
            }
        }
        return null;
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
