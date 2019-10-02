import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { WebsocketService } from 'app/core/core-services/websocket.service';
import { Projector, ProjectorElement } from 'app/shared/models/core/projector';

export interface SlideData<T = { error?: string }, P extends ProjectorElement = ProjectorElement> {
    data: T;
    element: P;
    error?: string;
}

export type ProjectorData = SlideData[];

interface AllProjectorData {
    [id: number]: ProjectorData | { error: string };
}

/**
 * Received data from server.
 */
interface ProjectorWebsocketMessage {
    /**
     * The `change_id` of the current update.
     */
    change_id: number;

    /**
     * The necessary new projector-data.
     */
    data: AllProjectorData;
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
     * When multiple projectory are requested, debounce these requests to just issue
     * one request, with all the needed projectors.
     */
    private readonly updateProjectorDataDebounceSubject = new Subject<void>();

    /**
     * Holds the current change id to check, if the update contains new content or a deprecated one.
     */
    private currentChangeId = 0;

    /**
     * Constructor.
     *
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService) {
        // Dispatch projector data.
        this.websocketService.getOberservable('projector').subscribe((update: ProjectorWebsocketMessage) => {
            if (this.currentChangeId > update.change_id) {
                return;
            }
            Object.keys(update.data).forEach(_id => {
                const id = parseInt(_id, 10);
                if (this.currentProjectorData[id]) {
                    this.currentProjectorData[id].next(update.data[id] as ProjectorData);
                }
            });
            this.currentChangeId = update.change_id;
        });

        // The service need to re-register, if the websocket connection was lost.
        this.websocketService.generalConnectEvent.subscribe(() => this.updateProjectorDataSubscription());

        // With a bit of debounce, update the needed projectors.
        this.updateProjectorDataDebounceSubject.pipe(auditTime(10)).subscribe(() => {
            const allActiveProjectorIds = Object.keys(this.openProjectorInstances)
                .map(id => parseInt(id, 10))
                .filter(id => this.openProjectorInstances[id] > 0);
            this.websocketService.send('listenToProjectors', { projector_ids: allActiveProjectorIds });
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
     * Requests to update the data subscription to the server.
     */
    private updateProjectorDataSubscription(): void {
        this.updateProjectorDataDebounceSubject.next();
    }

    /**
     * @returns the available projectior data for the given projector. Note that the data
     * might not be there, if there is no subscribtion for this projector. But the
     * data, if exist, is always the current data.
     */
    public getAvailableProjectorData(projector: Projector): ProjectorData | null {
        if (this.currentProjectorData[projector.id]) {
            return this.currentProjectorData[projector.id].getValue();
        }
    }
}
