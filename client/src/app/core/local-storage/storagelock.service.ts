import { Injectable } from '@angular/core';

/**
 * Provides a storage lock for waiting to database to be initialized.
 */
@Injectable({
    providedIn: 'root'
})
export class StoragelockService {
    private lock: Promise<void>;
    private resolve: () => void;
    private _indexedDBUsed = false;

    public get promise(): Promise<void> {
        return this.lock;
    }

    public get indexedDBUsed(): boolean {
        return this._indexedDBUsed;
    }

    public constructor() {
        this.lock = new Promise<void>(resolve => (this.resolve = resolve));
    }

    public OK(indexedDBUsed: boolean): void {
        this._indexedDBUsed = indexedDBUsed;
        this.resolve();
    }
}
