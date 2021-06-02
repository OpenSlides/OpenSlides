import { Injectable } from '@angular/core';

import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ConfigService } from 'app/core/ui-services/config.service';

const STREAM_RUNNING_STORAGE_KEY = 'streamIsRunning';

@Injectable({
    providedIn: 'root'
})
export class StreamService {
    public liveStreamUrlObservable: Observable<string>;

    /**
     * undefined is controlled behavior, meaning, this property was not
     * checked yet.
     * Thus, false-checks have to be explicit
     */
    public streamLoadedOnceObservable: Observable<boolean>;

    private isStreamRunningSubject = new Subject<boolean>();
    public isStreamRunningObservable = this.isStreamRunningSubject.asObservable();

    private canSeeLiveStreamSubject = new Subject<boolean>();
    public canSeeLiveStreamObservable = this.canSeeLiveStreamSubject.asObservable();

    public constructor(private storageMap: StorageMap, operator: OperatorService, configService: ConfigService) {
        this.liveStreamUrlObservable = configService.get<string>('general_system_stream_url');

        this.streamLoadedOnceObservable = this.storageMap
            .watch(STREAM_RUNNING_STORAGE_KEY, { type: 'boolean' })
            .pipe(distinctUntilChanged());

        operator.getUserObservable().subscribe(() => {
            this.canSeeLiveStreamSubject.next(operator.hasPerms(Permission.coreCanSeeLiveStream));
        });
    }

    public setStreamingLock(): void {
        this.storageMap.set(STREAM_RUNNING_STORAGE_KEY, true).subscribe(() => {});
    }

    public setStreamRunning(running: boolean): void {
        this.isStreamRunningSubject.next(running);
    }

    public deleteStreamingLock(): void {
        /**
         * subscriptions are faster than promises. This will fire more reliable
         * than converting it to promise first
         */
        this.storageMap.delete(STREAM_RUNNING_STORAGE_KEY).subscribe();
    }
}
