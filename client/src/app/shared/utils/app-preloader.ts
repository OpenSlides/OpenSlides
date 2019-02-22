import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Custom preload strategy class
 *
 * @example
 * ```
 * {
 *    path: 'agenda',
 *    loadChildren: './agenda/agenda.module#AgendaModule',
 *    data: { preload: true }
 * }
 * ```
 */
export class AppPreloader implements PreloadingStrategy {
    /**
     * Custom preload function.
     * Can be add to routes as data argument.
     *
     * @param route The route to load
     * @param load The load function
     */
    public preload(route: Route, load: Function): Observable<any> {
        return route.data && route.data.preload ? load() : of(null);
    }
}
