import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { Deferred } from '../promises/deferred';

@Injectable({
    providedIn: 'root'
})
export class StableService {
    public get isStable(): Promise<void> {
        return this.stable;
    }

    public get booted(): Observable<boolean> {
        return this.bootSubject.asObservable();
    }

    private stable = new Deferred();

    private bootSubject = new BehaviorSubject<boolean>(false);

    public constructor() {}

    public setStable(): void {
        this.stable.resolve();
        this.bootSubject.next(true);
    }
}
