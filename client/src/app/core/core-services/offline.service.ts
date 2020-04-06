import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { BannerDefinition, BannerService } from '../ui-services/banner.service';

/**
 * This service handles everything connected with being offline.
 *
 * TODO: This is just a stub. Needs to be done in the future; Maybe we cancel this whole concept
 * of this service. We'll see what happens here..
 */
@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    /**
     * BehaviorSubject to receive further status values.
     */
    private offline = new BehaviorSubject<boolean>(false);
    private bannerDefinition: BannerDefinition = {
        text: _('Offline mode'),
        icon: 'cloud_off'
    };

    public constructor(private banner: BannerService, translate: TranslateService) {
        translate.onLangChange.subscribe(() => {
            this.bannerDefinition.text = translate.instant(this.bannerDefinition.text);
        });
    }

    /**
     * Determines of you are either in Offline mode or not connected via websocket
     *
     * @returns whether the client is offline or not connected
     */
    public isOffline(): Observable<boolean> {
        return this.offline;
    }

    /**
     * Sets the offline flag. Restores the DataStoreService to the last known configuration.
     */
    public goOfflineBecauseFailedWhoAmI(): void {
        if (!this.offline.getValue()) {
            console.log('offline because whoami failed.');
        }
        this.goOffline();
    }

    /**
     * Sets the offline flag, because there is no connection to the server.
     */
    public goOfflineBecauseConnectionLost(): void {
        if (!this.offline.getValue()) {
            console.log('offline because connection lost.');
        }
        this.goOffline();
    }

    /**
     * Helper function to set offline status
     */
    private goOffline(): void {
        this.offline.next(true);
        this.banner.addBanner(this.bannerDefinition);
    }

    /**
     * Function to return to online-status.
     */
    public goOnline(): void {
        this.offline.next(false);
        this.banner.removeBanner(this.bannerDefinition);
    }
}
