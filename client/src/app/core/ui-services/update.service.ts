import { Injectable } from '@angular/core';

import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material';
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
     * Constructor.
     * Listens to available updates
     *
     * @param swUpdate Service Worker update service
     * @param matSnackBar Currently to show that an update is available
     */
    public constructor(private swUpdate: SwUpdate, matSnackBar: MatSnackBar, private notify: NotifyService) {
        swUpdate.available.subscribe(() => {
            // TODO: Find a better solution OR make an update-bar like for history mode
            const ref = matSnackBar.open('A new update is available!', 'Refresh', {
                duration: 0
            });

            // Enforces an update
            ref.onAction().subscribe(() => {
                this.swUpdate.activateUpdate().then(() => {
                    document.location.reload();
                });
            });
        });

        // Listen on requests from other users to check for updates.
        this.notify.getMessageObservable(UpdateService.NOTIFY_NAME).subscribe(() => {
            this.checkForUpdate();
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
