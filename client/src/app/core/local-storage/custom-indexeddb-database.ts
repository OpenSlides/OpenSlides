import { Optional, Inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
    IndexedDBDatabase,
    LOCAL_STORAGE_PREFIX,
    LocalStorageDatabase,
    MockLocalDatabase,
    LocalDatabase
} from '@ngx-pwa/local-storage';
import { fromEvent, race, Observable } from 'rxjs';
import { first } from 'rxjs/operators';

import { StoragelockService } from './storagelock.service';

@Injectable({
    providedIn: 'root'
})
export class CustomIndexedDBDatabase extends IndexedDBDatabase {
    public constructor(
        private storageLock: StoragelockService,
        @Optional() @Inject(LOCAL_STORAGE_PREFIX) protected prefix: string | null = null
    ) {
        super(prefix);
    }

    /**
     * Connects to IndexedDB and creates the object store on first time
     */
    protected connect(prefix: string | null = null): void {
        let request: IDBOpenDBRequest;

        // Connecting to IndexedDB
        try {
            request = indexedDB.open(this.dbName);
        } catch (error) {
            // Fallback storage if IndexedDb connection is failing
            this.setFallback(prefix);
            return;
        }

        // Listening the event fired on first connection, creating the object store for local storage
        (fromEvent(request, 'upgradeneeded') as Observable<Event>).pipe(first()).subscribe(event => {
            // Getting the database connection
            const database = (event.target as IDBRequest).result as IDBDatabase;

            // Checking if the object store already exists, to avoid error
            if (!database.objectStoreNames.contains(this.objectStoreName)) {
                // Creating the object store for local storage
                database.createObjectStore(this.objectStoreName);
            }
        });

        // Listening the success event and converting to an RxJS Observable
        const success = fromEvent(request, 'success') as Observable<Event>;

        // Merging success and errors events
        (race(success, this.toErrorObservable(request, `connection`)) as Observable<Event>).pipe(first()).subscribe(
            event => {
                const db = (event.target as IDBRequest).result as IDBDatabase;

                // CUSTOM: If the indexedDB initialization fails, because 'upgradeneeded' didn't fired
                // the fallback will be used.
                if (!db.objectStoreNames.contains(this.objectStoreName)) {
                    this.setFallback(prefix);
                } else {
                    // Storing the database connection for further access
                    this.database.next(db);
                    this.storageLock.OK();
                }
            },
            () => {
                // Fallback storage if IndexedDb connection is failing
                this.setFallback(prefix);
            }
        );
    }

    // CUSTOM: If the fallback is used, unlock the storage service
    public setFallback(prefix: string): void {
        console.log('uses localStorage as IndexedDB fallback!');
        super.setFallback(prefix);
        this.storageLock.OK();
    }
}

export function customLocalDatabaseFactory(
    platformId: Object,
    storagelock: StoragelockService,
    prefix: string | null
): LocalDatabase {
    if (isPlatformBrowser(platformId) && 'indexedDB' in window && indexedDB !== undefined && indexedDB !== null) {
        // Try with IndexedDB in modern browsers
        // CUSTOM: Use our own IndexedDB implementation
        return new CustomIndexedDBDatabase(storagelock, prefix);
    } else if (
        isPlatformBrowser(platformId) &&
        'localStorage' in window &&
        localStorage !== undefined &&
        localStorage !== null
    ) {
        // Try with localStorage in old browsers (IE9)
        return new LocalStorageDatabase(prefix);
    } else {
        // Fake database for server-side rendering (Universal)
        return new MockLocalDatabase();
    }
}
