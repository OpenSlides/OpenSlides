import { EventEmitter, Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

export enum OfflineReason {
    WhoAmIFailed,
    ConnectionLost
}

@Injectable({
    providedIn: 'root'
})
export class OfflineBroadcastService {
    public readonly isOfflineSubject = new BehaviorSubject<boolean>(false);
    public get isOfflineObservable(): Observable<boolean> {
        return this.isOfflineSubject.asObservable();
    }

    private readonly _goOffline = new EventEmitter<OfflineReason>();
    public get goOfflineObservable(): Observable<OfflineReason> {
        return this._goOffline.asObservable();
    }

    public constructor() {}

    public goOffline(reason: OfflineReason): void {
        this._goOffline.emit(reason);
    }

    public isOffline(): boolean {
        return this.isOfflineSubject.getValue();
    }

    public isOnline(): boolean {
        return !this.isOffline();
    }
}
