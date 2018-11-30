import { Injectable } from '@angular/core';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { OpenSlidesStatusService } from './openslides-status.service';

/**
 * Provides an async API to an key-value store using ngx-pwa which is internally
 * using IndexedDB or localStorage as a fallback.
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    /**
     * Constructor to create the StorageService. Needs the localStorage service.
     * @param localStorage
     */
    public constructor(private localStorage: LocalStorage, private OSStatus: OpenSlidesStatusService) {}

    /**
     * Sets the item into the store asynchronously.
     * @param key
     * @param item
     */
    public async set(key: string, item: any): Promise<void> {
        this.assertNotHistroyMode();
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
     * TODO: This needs adjustment to ensure safe access.
     * Since angular 7 `LocalStorrage.getItem` will return "unknown" instead of any.
     * https://github.com/cyrilletuzi/angular-async-local-storage/blob/master/docs/MIGRATION_TO_V7.md
     * @param key The key to get the value from
     * @returns The requested value to the key
     */
    public async get<T>(key: string): Promise<T> {
        return await this.localStorage.getUnsafeItem<T>(key).toPromise();
    }

    /**
     * Remove the key from the store.
     * @param key The key to remove the value from
     */
    public async remove(key: string): Promise<void> {
        this.assertNotHistroyMode();
        if (!(await this.localStorage.removeItem(key).toPromise())) {
            throw new Error('Could not delete the item.');
        }
    }

    /**
     * Clear the whole cache
     */
    public async clear(): Promise<void> {
        this.assertNotHistroyMode();
        if (!(await this.localStorage.clear().toPromise())) {
            throw new Error('Could not clear the storage.');
        }
    }

    /**
     * Throws an error, if we are in history mode.
     */
    private assertNotHistroyMode(): void {
        if (this.OSStatus.isInHistoryMode) {
            throw new Error('You cannot use the storageService in histroy mode.');
        }
    }
}
