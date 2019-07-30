import { Injectable } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';

import { filter, pairwise } from 'rxjs/operators';

/**
 * Watches URL changes.
 * Can be enhanced using locale storage to support back-navigation even after reload
 */
@Injectable({
    providedIn: 'root'
})
export class RoutingStateService {
    /**
     * Hold the previous URL
     */
    private _previousUrl: string;

    /**
     * Unsafe paths that the user should not go "back" to
     * TODO: Might also work using Routing parameters
     */
    private unsafeUrls: string[] = ['/login', '/privacypolicy', '/legalnotice'];

    /**
     * @return Get the previous URL
     */
    public get previousUrl(): string {
        return this._previousUrl ? this._previousUrl : null;
    }

    public get isSafePrevUrl(): boolean {
        return !!this.previousUrl && !this.unsafeUrls.includes(this.previousUrl);
    }

    /**
     * Watch routing changes and save the last visited URL
     *
     * @param router Angular Router
     */
    public constructor(private router: Router) {
        this.router.events
            .pipe(
                filter(e => e instanceof RoutesRecognized),
                pairwise()
            )
            .subscribe((event: any[]) => {
                this._previousUrl = event[0].urlAfterRedirects;
            });
    }
}
