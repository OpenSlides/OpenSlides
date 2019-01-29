import { Injectable } from '@angular/core';
import { WebsocketService } from 'app/core/services/websocket.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { ProjectorElement } from 'app/shared/models/core/projector';

export interface SlideData<T = object> {
    data: T;
    element: ProjectorElement;
    error?: string;
}

export type ProjectorData = SlideData[];

interface AllProjectorData {
    [id: number]: ProjectorData | { error: string };
}

/**
 * This service handles the websocket connection for the projector data.
 * Each projector instance registers itself by calling `getProjectorObservable`.
 * A projector should deregister itself, when the component is destroyed.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorDataService {
    /**
     * Counts the open projector instances per projector id.
     */
    private openProjectorInstances: { [id: number]: number } = {};

    /**
     * Holds the current projector data for each projector.
     */
    private currentProjectorData: { [id: number]: BehaviorSubject<ProjectorData | null> } = {};

    /**
     * Constructor.
     *
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService) {
        // TODO: On reconnect, we do need to re-inform the server about all needed projectors. This also
        // updates our projector data, which is great!
        this.websocketService.getOberservable('projector').subscribe((update: AllProjectorData) => {
            Object.keys(update).forEach(_id => {
                const id = parseInt(_id, 10);
                if ((<{ error: string }>update[id]).error !== undefined) {
                    console.log('TODO: Why does the server sends errors on autpupdates?');
                } else {
                    if (this.currentProjectorData[id]) {
                        this.currentProjectorData[id].next(update[id] as ProjectorData);
                    }
                }
            });
        });
    }

    /**
     * Gets an observable for the projector data.
     *
     * @param projectorId The requested projector
     * @return an observable for the projector data of the given projector.
     */
    public getProjectorObservable(projectorId: number): Observable<ProjectorData | null> {
        // Count projectors.
        if (!this.openProjectorInstances[projectorId]) {
            this.openProjectorInstances[projectorId] = 1;
            if (!this.currentProjectorData[projectorId]) {
                this.currentProjectorData[projectorId] = new BehaviorSubject<ProjectorData | null>(null);
            }
        } else {
            this.openProjectorInstances[projectorId]++;
        }

        // Projector opened the first time.
        if (this.openProjectorInstances[projectorId] === 1) {
            this.updateProjectorDataSubscription();
        }
        return this.currentProjectorData[projectorId].asObservable();
    }

    /**
     * Unsubscribe data from the server, if the last projector was closed.
     *
     * @param projectorId the projector.
     */
    public projectorClosed(projectorId: number): void {
        if (this.openProjectorInstances[projectorId]) {
            this.openProjectorInstances[projectorId]--;
        }
        if (this.openProjectorInstances[projectorId] === 0) {
            this.updateProjectorDataSubscription();
            this.currentProjectorData[projectorId].next(null);
        }
    }

    /**
     * Gets initial data and keeps reuesting data.
     */
    private updateProjectorDataSubscription(): void {
        const allActiveProjectorIds = Object.keys(this.openProjectorInstances)
            .map(id => parseInt(id, 10))
            .filter(id => this.openProjectorInstances[id] > 0);
        this.websocketService.send('listenToProjectors', { projector_ids: allActiveProjectorIds });
    }
}
