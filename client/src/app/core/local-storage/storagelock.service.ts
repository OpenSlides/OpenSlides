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

    public get promise(): Promise<void> {
        return this.lock;
    }

    public constructor() {
        this.lock = new Promise<void>(resolve => (this.resolve = resolve));
    }

    public OK(): void {
        this.resolve();
    }
}
