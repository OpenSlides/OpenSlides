import { Location } from '@angular/common';
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
    private unsafeUrls: string[] = ['/login', '/privacypolicy', '/legalnotice', '/new', '/create'];

    /**
     * Checks if the previous URL is safe to navigate to.
     * If this fails, the open nav button should be shown
     */
    public get isSafePrevUrl(): boolean {
        if (this._previousUrl) {
            return !this.unsafeUrls.some(unsafeUrl => this._previousUrl.includes(unsafeUrl));
        } else {
            return false;
        }
    }

    public get previousUrl(): string {
        return this._previousUrl;
    }

    /**
     * Watch routing changes and save the last visited URL
     *
     * @param router Angular Router
     */
    public constructor(private router: Router, private location: Location) {
        this.router.events
            .pipe(
                filter(e => e instanceof RoutesRecognized),
                pairwise()
            )
            .subscribe((event: any[]) => {
                this._previousUrl = event[0].urlAfterRedirects;
            });
    }

    public goBack(): void {
        this.location.back();
    }
}
