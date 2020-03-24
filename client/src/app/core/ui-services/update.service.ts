import { Injectable } from '@angular/core';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';

import { Observable } from 'rxjs';

/**
 * Handle Service Worker updates using the SwUpdate service form angular.
 */
@Injectable({
    providedIn: 'root'
})
export class UpdateService {
    /**
     * @returns the updateSubscription
     */
    public get updateObservable(): Observable<UpdateAvailableEvent> {
        return this.swUpdate.available;
    }

    /**
     * Constructor.
     * Listens to available updates
     *
     * @param swUpdate Service Worker update service
     * @param matSnackBar Currently to show that an update is available
     */
    public constructor(private swUpdate: SwUpdate) {}

    /**
     * Manually applies the update if one was found
     */
    public applyUpdate(): void {
        this.swUpdate.activateUpdate().then(() => {
            document.location.reload();
        });
    }

    /**
     * Trigger that to manually check for updates
     */
    public checkForUpdate(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.checkForUpdate();
        }
    }
}
