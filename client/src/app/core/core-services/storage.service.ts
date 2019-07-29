import { Injectable } from '@angular/core';

import { LocalStorage } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';

import { OpenSlidesStatusService } from './openslides-status.service';

/**
 * Provides an async API to an key-value store using ngx-pwa which is internally
 * using IndexedDB or localStorage as a fallback.
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private noClearKeys: string[] = [];

    /**
     * Constructor to create the StorageService. Needs the localStorage service.
     * @param localStorage
     */
    public constructor(private localStorage: LocalStorage, private OSStatus: OpenSlidesStatusService) {}

    public addNoClearKey(key: string): void {
        this.noClearKeys.push(key);
    }

    /**
     * Sets the item into the store asynchronously.
     * @param key
     * @param item
     */
    public async set(key: string, item: any): Promise<void> {
        this.assertNotHistoryMode();
        if (item === null || item === undefined) {
            await this.remove(key); // You cannot do a setItem with null or undefined...
        } else {
            if (!(await this.localStorage.setItem(key, item).toPromise())) {
                throw new Error('Could not set the item.');
            }
        }
    }

    /**
     * get a value from the store. You need to subscribe to the request to retrieve the value.
     *
     * @param key The key to get the value from
     * @returns The requested value to the key
     */
    public async get<T>(key: string): Promise<T> {
        return ((await this.localStorage.getItem<T>(key)) as Observable<T>).toPromise();
    }

    /**
     * Remove the key from the store.
     * @param key The key to remove the value from
     */
    public async remove(key: string): Promise<void> {
        this.assertNotHistoryMode();
        if (!(await this.localStorage.removeItem(key).toPromise())) {
            throw new Error('Could not delete the item.');
        }
    }

    /**
     * Clear the whole cache except for keys given in `addNoClearKey`.
     */
    public async clear(): Promise<void> {
        this.assertNotHistoryMode();
        const savedData: { [key: string]: any } = {};
        for (const key of this.noClearKeys) {
            savedData[key] = await this.get(key);
        }
        if (!(await this.localStorage.clear().toPromise())) {
            throw new Error('Could not clear the storage.');
        }
        for (const key of this.noClearKeys) {
            await this.set(key, savedData[key]);
        }
    }

    /**
     * Throws an error, if we are in history mode.
     */
    private assertNotHistoryMode(): void {
        if (this.OSStatus.isInHistoryMode) {
            throw new Error('You cannot use the storageService in histroy mode.');
        }
    }
}
