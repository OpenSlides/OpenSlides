import { Observable, of } from 'rxjs';

/**
 * injects the {@link DataStoreService} to all its children and provides a generic function to catch errors
 * should be abstract and a mere parent to all {@link DataStoreService} accessors
 */
export abstract class OpenSlidesComponent {
    /**
     * Empty constructor
     *
     * Static injection of {@link DataStoreService} in all child instances of OpenSlidesComponent
     * Throws a warning even tho it is the new syntax. Ignored for now.
     */
    public constructor() {}

    /**
     * Generic error handling for everything that makes HTTP Calls
     * TODO: could have more features
     * @return an observable error
     */
    public handleError<T>(): (error: any) => Observable<T> {
        return (error: any): Observable<T> => {
            console.error(error);
            return of(error);
        };
    }
}
