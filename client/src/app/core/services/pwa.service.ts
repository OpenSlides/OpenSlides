import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Service for Progressive Web App options
 */
@Injectable({
    providedIn: 'root'
})
export class PwaService {
    public promptEvent;

    public constructor(swUpdate: SwUpdate) {
        // check if an update is available
        swUpdate.available.subscribe(event => {
            // TODO: ask user if app should update now
            window.location.reload();
        });

        // install button
        window.addEventListener('beforeinstallprompt', event => {
            this.promptEvent = event;
        });
    }
}
