import { Injector } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DataStoreService } from './core/services/data-store.service';
import { CacheService } from './core/services/cache.service';

/**
 * injects the {@link DataStoreService} to all its children and provides a generic function to catch errors
 * should be abstract and a mere parent to all {@link DataStoreService} accessors
 */
export abstract class OpenSlidesComponent {
    /**
     * The dataStore Service
     */
    private static _DS: DataStoreService;

    public static injector: Injector;

    /**
     * Empty constructor
     *
     * Static injection of {@link DataStoreService} in all child instances of OpenSlidesComponent
     * Throws a warning even tho it is the new syntax. Ignored for now.
     */
    constructor() {}

    /**
     * getter to access the {@link DataStoreService}
     * @example this.DS.get(User)
     * @return access to dataStoreService
     */
    get DS(): DataStoreService {
        if (!OpenSlidesComponent.injector) {
            throw new Error('OpenSlides is not bootstrapping right. This component should have the Injector.');
        }
        if (OpenSlidesComponent._DS == null) {
            const injector = Injector.create({
                providers: [
                    {
                        provide: DataStoreService,
                        useClass: DataStoreService,
                        deps: [CacheService]
                    }
                ],
                parent: OpenSlidesComponent.injector
            });
            OpenSlidesComponent._DS = injector.get(DataStoreService);
        }
        return OpenSlidesComponent._DS;
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
