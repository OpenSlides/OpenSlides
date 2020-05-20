import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { ListOfSpeakersRepositoryService } from 'app/core/repositories/agenda/list-of-speakers-repository.service';
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
    /**
     * This map holds the current (number or null) los-id for the the projector.
     * It is used to check, if the reference has changed (this clos id changed for one projector).
     */
    private currentListOfSpeakersIds: { [projectorId: number]: number | null } = {};

    /**
     * Active subscriptions for the clos of each projector.
     */
    private currentListOfSpeakersSubscriptions: { [projectorId: number]: Subscription } = {};

    /**
     * All subjects for all clos of each projector.
     */
    private currentListOfSpeakers: { [projectorId: number]: BehaviorSubject<ViewListOfSpeakers | null> } = {};

    public constructor(
        private projectorService: ProjectorService,
        private projectorRepo: ProjectorRepositoryService,
        private listOfSpeakersRepo: ListOfSpeakersRepositoryService,
        private slideManager: SlideManager
    ) {
        // Watch for changes and update the current list of speakers for every projector.
        this.projectorRepo.getGeneralViewModelObservable().subscribe(projector => {
            if (projector) {
                this.setListOfSpeakersForProjector(projector);
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
        if (!this.currentListOfSpeakers[projector.id]) {
            this.setListOfSpeakersForProjector(projector);
        }
        return this.currentListOfSpeakers[projector.id].asObservable();
    }

    /**
     * calld on startup and on every projector update.
     * If the reference didn't changed the clos for the projector just gets pushed.
     *
     * If it was the first call to this function for a projector or the id changed,
     * there will be a subscription to the LOS-repo to stay informed when the clos
     * of the projector is updated (if there is a current CLOS).
     */
    private setListOfSpeakersForProjector(projector: ViewProjector): void {
        const listOfSpeakers = this.getCurrentListOfSpeakersForProjector(projector);
        const listOfSpeakersId = listOfSpeakers ? listOfSpeakers.id : null;
        if (this.currentListOfSpeakersIds[projector.id] === listOfSpeakersId) {
            this.currentListOfSpeakers[projector.id].next(listOfSpeakers);
        } else {
            this.currentListOfSpeakersIds[projector.id] = listOfSpeakersId;

            if (!this.currentListOfSpeakers[projector.id]) {
                this.currentListOfSpeakers[projector.id] = new BehaviorSubject(listOfSpeakers);
            }
            // Do not send the listOfSpeakers through currentListOfSpeakers, because this will be
            // toggled by the listOfSpeakersRepo subscription below.

            if (this.currentListOfSpeakersSubscriptions[projector.id]) {
                this.currentListOfSpeakersSubscriptions[projector.id].unsubscribe();
                this.currentListOfSpeakersSubscriptions[projector.id] = null;
            }
            if (listOfSpeakersId !== null) {
                this.currentListOfSpeakersSubscriptions[projector.id] = this.listOfSpeakersRepo
                    .getViewModelObservable(listOfSpeakers.id)
                    .subscribe(los => {
                        if (los && this.currentListOfSpeakers[projector.id]) {
                            this.currentListOfSpeakers[projector.id].next(los);
                        }
                    });
            }
        }
    }

    /**
     * Tries to get the view list of speakers for one non stable element on the projector.
     *
     * @param projector The projector
     * @returns The view list of speakers or null, if there is no such projector element.
     */
    private getCurrentListOfSpeakersForProjector(projector: ViewProjector): ViewListOfSpeakers | null {
        const nonStableElements = projector.elements.filter(element => !element.stable);
        for (const nonStableElement of nonStableElements) {
            const identifiableNonStableElement = this.slideManager.getIdentifiableProjectorElement(nonStableElement);
            try {
                const viewModel = this.projectorService.getViewModelFromProjectorElement(identifiableNonStableElement);
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
