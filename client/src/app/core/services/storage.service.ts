import { Injectable } from '@angular/core';
import { LocalStorage } from '@ngx-pwa/local-storage';

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
    public constructor(private localStorage: LocalStorage) {}

    /**
     * Sets the item into the store asynchronously.
     * @param key
     * @param item
     */
    public async set(key: string, item: any): Promise<void> {
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
     * @param key The key to get the value from
     * @returns The requested value to the key
     */
    public async get<T>(key: string): Promise<T> {
        return await this.localStorage.getItem<T>(key).toPromise();
    }

    /**
     * Remove the key from the store.
     * @param key The key to remove the value from
     */
    public async remove(key: string): Promise<void> {
        if (!(await this.localStorage.removeItem(key).toPromise())) {
            throw new Error('Could not delete the item.');
        }
    }

    /**
     * Clear the whole cache
     */
    public async clear(): Promise<void> {
        console.log('clear storage');
        if (!(await this.localStorage.clear().toPromise())) {
            throw new Error('Could not clear the storage.');
        }
    }
}
