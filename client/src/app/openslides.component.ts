import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { DataStoreService } from 'app/core/services/dataStore.service';

/**
 * injects the {@link DataStoreService} to all its children and provides a generic function to catch errors
 * should be abstract and a mere parent to all {@link DataStoreService} accessors
 */
export abstract class OpenSlidesComponent {
    /**
     * To inject the {@link DataStoreService} into the children of OpenSlidesComponent
     */
    protected injector: Injector;

    /**
     * The dataStore Service
     */
    protected dataStore: DataStoreService;

    /**
     * Empty constructor
     *
     * Static injection of {@link DataStoreService} in all child instances of OpenSlidesComponent
     * Throws a warning even tho it is the new syntax. Ignored for now.
     */
    constructor() {
        this.injector = Injector.create([{ provide: DataStoreService, useClass: DataStoreService, deps: [] }]);
    }

    /**
     * getter to access the {@link DataStoreService}
     * @example this.DS.get(User)
     * @return access to dataStoreService
     */
    get DS(): DataStoreService {
        if (this.dataStore == null) {
            this.dataStore = this.injector.get(DataStoreService);
        }
        return this.dataStore;
    }

    /**
     * Generic error handling for everything that makes HTTP Calls
     * TODO: could have more features
     * @return an observable error
     */
    handleError<T>() {
        return (error: any): Observable<T> => {
            console.error(error);
            return of(error);
        };
    }
}
