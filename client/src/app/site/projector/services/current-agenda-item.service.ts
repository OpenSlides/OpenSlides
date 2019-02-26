import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { ProjectorService } from 'app/core/core-services/projector.service';
import { ViewProjector } from '../models/view-projector';
import { ProjectorRepositoryService } from 'app/core/repositories/projector/projector-repository.service';
import { SlideManager } from 'app/slides/services/slide-manager.service';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { ViewItem } from 'app/site/agenda/models/view-item';

/**
 * Observes the projector config for a given projector and returns a observable of the
 * current view item displayed at on the projector.
 */
@Injectable({
    providedIn: 'root'
})
export class CurrentAgendaItemService {
    private currentItemIds: { [projectorId: number]: BehaviorSubject<ViewItem | null> } = {};

    public constructor(
        private projectorService: ProjectorService,
        private projectorRepo: ProjectorRepositoryService,
        private slideManager: SlideManager
    ) {
        this.projectorRepo.getGeneralViewModelObservable().subscribe(projector => {
            if (projector && this.currentItemIds[projector.id]) {
                const item = this.getCurrentAgendaItemIdForProjector(projector);
                this.currentItemIds[projector.id].next(item);
            }
        });
    }

    /**
     * Returns an observable for the agenda item id of the currently projected element on the
     * given projector.
     *
     * @param projector The projector to observe.
     * @returns An observalbe for the agenda item id. Null, if no element with an agenda item is shown.
     */
    public getAgendaItemObservable(projector: ViewProjector): Observable<ViewItem | null> {
        if (!this.currentItemIds[projector.id]) {
            const item = this.getCurrentAgendaItemIdForProjector(projector);
            this.currentItemIds[projector.id] = new BehaviorSubject<ViewItem | null>(item);
        }
        return this.currentItemIds[projector.id].asObservable();
    }

    /**
     * Tries to get the agenda item id for one non stable element on the projector.
     *
     * @param projector The projector
     * @returns The agenda item id or null, if there is no such projector element.
     */
    private getCurrentAgendaItemIdForProjector(projector: ViewProjector): ViewItem | null {
        const nonStableElements = projector.elements.filter(element => !element.stable);
        if (nonStableElements.length > 0) {
            const nonStableElement = this.slideManager.getIdentifialbeProjectorElement(nonStableElements[0]); // The normal case is just one non stable slide
            try {
                const viewModel = this.projectorService.getViewModelFromProjectorElement(nonStableElement);
                if (viewModel instanceof BaseAgendaViewModel) {
                    return viewModel.getAgendaItem();
                }
            } catch (e) {
                // make TypeScript silent.
            }
        }
        return null;
    }
}
