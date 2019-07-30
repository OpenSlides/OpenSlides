import { Injectable } from '@angular/core';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';

import { Observable } from 'rxjs';

import { NotifyService } from '../core-services/notify.service';

/**
 * Handle Service Worker updates using the SwUpdate service form angular.
 */
@Injectable({
    providedIn: 'root'
})
export class UpdateService {
    private static NOTIFY_NAME = 'swCheckForUpdate';

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
    public constructor(private swUpdate: SwUpdate, private notify: NotifyService) {
        // Listen on requests from other users to check for updates.
        this.notify.getMessageObservable(UpdateService.NOTIFY_NAME).subscribe(() => {
            this.checkForUpdate();
        });
    }

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

    /**
     * Emits a message to all clients initiating to check for updates. This method
     * can only be called by users with 'users.can_manage'. This will be checked by
     * the server.
     */
    public initiateUpdateCheckForAllClients(): void {
        this.notify.sendToAllUsers(UpdateService.NOTIFY_NAME, {});
    }
}
