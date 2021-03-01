import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { BehaviorSubject } from 'rxjs';

import { OfflineBroadcastService } from '../core-services/offline-broadcast.service';

export interface BannerDefinition {
    type?: string;
    class?: string;
    icon?: string;
    text?: string;
    subText?: string;
    link?: string;
    largerOnMobileView?: boolean;
}

/**
 * A service handling the active banners at the top of the site. Banners are defined via a BannerDefinition
 * and are removed by reference so the service adding a banner has to store the reference to remove it later
 */
@Injectable({
    providedIn: 'root'
})
export class BannerService {
    private offlineBannerDefinition: BannerDefinition = {
        text: _('Offline mode'),
        icon: 'cloud_off'
    };

    public activeBanners: BehaviorSubject<BannerDefinition[]> = new BehaviorSubject<BannerDefinition[]>([]);

    public constructor(offlineBroadcastService: OfflineBroadcastService) {
        offlineBroadcastService.isOfflineObservable.subscribe(offline => {
            if (offline) {
                this.addBanner(this.offlineBannerDefinition);
            } else {
                this.removeBanner(this.offlineBannerDefinition);
            }
        });
    }

    /**
     * Adds a banner to the list of active banners. Skip the banner if it's already in the list
     * @param toAdd the banner to add
     */
    public addBanner(toAdd: BannerDefinition): void {
        if (!this.activeBanners.value.find(banner => banner === toAdd)) {
            const newBanners = this.activeBanners.value.concat([toAdd]);
            this.activeBanners.next(newBanners);
        }
    }

    /**
     * Replaces a banner with another. Convenience method to prevent flickering
     * @param toAdd the banner to add
     * @param toRemove the banner to remove
     */
    public replaceBanner(toRemove: BannerDefinition, toAdd: BannerDefinition): void {
        if (toRemove) {
            const newArray = Array.from(this.activeBanners.value);
            const idx = newArray.findIndex(banner => banner === toRemove);
            if (idx === -1) {
                throw new Error("The given banner couldn't be found.");
            } else {
                newArray[idx] = toAdd;
                this.activeBanners.next(newArray); // no need for this.update since the length doesn't change
            }
        } else {
            this.addBanner(toAdd);
        }
    }

    /**
     * removes the given banner
     * @param toRemove the banner to remove
     */
    public removeBanner(toRemove: BannerDefinition): void {
        if (toRemove) {
            const newBanners = this.activeBanners.value.filter(banner => banner !== toRemove);
            this.activeBanners.next(newBanners);
        }
    }
}
