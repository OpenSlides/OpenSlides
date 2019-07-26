import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { isBaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { ViewProjector } from '../models/view-projector';

/**
 * Observes the projector config for a given projector and returns a observable of the
 * current view list of speakers displayed on the projector.
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentListOfSpeakersService {
    private currentListOfSpeakersIds: { [projectorId: number]: BehaviorSubject<ViewListOfSpeakers | null> } = {};

    public constructor(
        private projectorService: ProjectorService,
        private projectorRepo: ProjectorRepositoryService,
        private slideManager: SlideManager
    ) {
        // Watch for changes and update the current list of speakers for every projector.
        this.projectorRepo.getGeneralViewModelObservable().subscribe(projector => {
            if (projector && this.currentListOfSpeakersIds[projector.id]) {
                const listOfSpeakers = this.getCurrentListOfSpeakersForProjector(projector);
                this.currentListOfSpeakersIds[projector.id].next(listOfSpeakers);
            }
        });
    }

    /**
     * Returns an observable for the view list of speakers of the currently projected element on the
     * given projector.
     *
     * @param projector The projector to observe.
     * @returns An observalbe for the list of speakers. Null, if no element with an list of speakers is shown.
     */
    public getListOfSpeakersObservable(projector: ViewProjector): Observable<ViewListOfSpeakers | null> {
        if (!this.currentListOfSpeakersIds[projector.id]) {
            const listOfSpeakers = this.getCurrentListOfSpeakersForProjector(projector);
            this.currentListOfSpeakersIds[projector.id] = new BehaviorSubject<ViewListOfSpeakers | null>(
                listOfSpeakers
            );
        }
        return this.currentListOfSpeakersIds[projector.id].asObservable();
    }

    /**
     * Tries to get the view list of speakers for one non stable element on the projector.
     *
     * @param projector The projector
     * @returns The view list of speakers or null, if there is no such projector element.
     */
    private getCurrentListOfSpeakersForProjector(projector: ViewProjector): ViewListOfSpeakers | null {
        const nonStableElements = projector.elements.filter(element => !element.stable);
        if (nonStableElements.length > 0) {
            const nonStableElement = this.slideManager.getIdentifialbeProjectorElement(nonStableElements[0]); // The normal case is just one non stable slide
            try {
                const viewModel = this.projectorService.getViewModelFromProjectorElement(nonStableElement);
                if (isBaseViewModelWithListOfSpeakers(viewModel)) {
                    return viewModel.listOfSpeakers;
                }
            } catch (e) {
                // make TypeScript silent.
            }
        }
        return null;
    }
}
