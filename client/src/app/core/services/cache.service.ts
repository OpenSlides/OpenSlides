import { Injectable } from '@angular/core';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';

/**
 * Container objects for the setQueue.
 */
interface SetContainer {
    key: string;
    item: any;
    callback: (value: boolean) => void;
}

/**
 * Container objects for the removeQueue.
 */
interface RemoveContainer {
    key: string;
    callback: (value: boolean) => void;
}

/**
 * Provides an async API to an key-value store using ngx-pwa which is internally
 * using IndexedDB or localStorage as a fallback.
 */
@Injectable({
    providedIn: 'root'
})
export class CacheService {
    /**
     * The queue of waiting set requests. Just one request (with the same key, which is
     * an often case) at the time can be handeled. The SetContainer encapsulates the key,
     * item and callback.
     */
    private setQueue: SetContainer[] = [];

    /**
     * The queue of waiting remove requests. Same reason for the queue es the @name _setQueue.
     */
    private removeQueue: RemoveContainer[] = [];

    /**
     * Constructor to create the CacheService. Needs the localStorage service.
     * @param localStorage
     */
    constructor(private localStorage: LocalStorage) {}

    /**
     * Sets the item into the store asynchronously.
     * @param key
     * @param item
     * @param callback An optional callback that is called on success
     */
    public set(key: string, item: any, callback?: (value: boolean) => void): void {
        if (!callback) {
            callback = () => {};
        }

        // Put the set request into the queue
        const queueObj: SetContainer = {
            key: key,
            item: item,
            callback: callback
        };
        this.setQueue.unshift(queueObj);

        // If this is the only object, put it into the cache.
        if (this.setQueue.length === 1) {
            this.localStorage.setItem(key, item).subscribe(this._setCallback.bind(this), this._error);
        }
    }

    /**
     * gets called, if a set of the first item in the queue was successful.
     * @param value success
     */
    private _setCallback(success: boolean): void {
        // Call the callback and remove the object from the queue
        this.setQueue[0].callback(success);
        this.setQueue.pop();
        // If there are objects left, insert the first one into the cache.
        if (this.setQueue.length > 0) {
            const queueObj = this.setQueue[0];
            this.localStorage.setItem(queueObj.key, queueObj.item).subscribe(this._setCallback.bind(this), this._error);
        }
    }

    /**
     * get a value from the store. You need to subscribe to the request to retrieve the value.
     * @param key The key to get the value from
     */
    public get<T>(key: string): Observable<T> {
        return this.localStorage.getItem<T>(key);
    }

    /**
     * Remove the key from the store.
     * @param key The key to remove the value from
     * @param callback An optional callback that is called on success
     */
    public remove(key: string, callback?: (value: boolean) => void): void {
        if (!callback) {
            callback = () => {};
        }

        // Put the remove request into the queue
        const queueObj: RemoveContainer = {
            key: key,
            callback: callback
        };
        this.removeQueue.unshift(queueObj);

        // If this is the only object, remove it from the cache.
        if (this.removeQueue.length === 1) {
            this.localStorage.removeItem(key).subscribe(this._removeCallback.bind(this), this._error);
        }
    }

    /**
     * gets called, if a remove of the first item in the queue was successfull.
     * @param value success
     */
    private _removeCallback(success: boolean): void {
        // Call the callback and remove the object from the queue
        this.removeQueue[0].callback(success);
        this.removeQueue.pop();
        // If there are objects left, remove the first one from the cache.
        if (this.removeQueue.length > 0) {
            const queueObj = this.removeQueue[0];
            this.localStorage.removeItem(queueObj.key).subscribe(this._removeCallback.bind(this), this._error);
        }
    }

    /**
     * Clear the whole cache
     * @param callback An optional callback that is called on success
     */
    public clear(callback?: (value: boolean) => void): void {
        if (!callback) {
            callback = () => {};
        }
        this.localStorage.clear().subscribe(callback, this._error);
    }

    /**
     * First error catching function.
     */
    private _error(): void {
        console.error('caching error', arguments);
    }
}
