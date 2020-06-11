import { Component, OnInit } from '@angular/core';

import { StorageMap } from '@ngx-pwa/local-storage';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'os-live-stream',
    templateUrl: './live-stream.component.html',
    styleUrls: ['./live-stream.component.scss']
})
export class LiveStreamComponent implements OnInit {
    public showStream = false;

    private RTC_LOGGED_STORAGE_KEY = 'rtcIsLoggedIn';

    public isUserInConference: boolean;

    public constructor(private storageMap: StorageMap) {}

    public ngOnInit(): void {
        this.storageMap
            .watch(this.RTC_LOGGED_STORAGE_KEY)
            .pipe(distinctUntilChanged())
            .subscribe((inUse: boolean) => {
                this.isUserInConference = inUse;
            });
    }

    public toggleShowStream(): void {
        this.showStream = !this.showStream;
    }

    public async forceReloadStream(): Promise<void> {
        await this.deleteJitsiLock();
    }

    /**
     * todo: DUP
     */
    private async deleteJitsiLock(): Promise<void> {
        await this.storageMap.delete(this.RTC_LOGGED_STORAGE_KEY).toPromise();
    }
}
