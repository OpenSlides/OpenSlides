import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from '@angular/router';

import { FallbackRoutesService } from './fallback-routes.service';
import { OpenSlidesService } from './openslides.service';
import { OperatorService, Permission } from './operator.service';

/**
 * Classical Auth-Guard. Checks if the user has to correct permissions to enter a page, and forwards to login if not.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
    /**
     * Constructor
     *
     * @param router To navigate to a target URL
     * @param operator Asking for the required permission
     * @param openSlidesService Handle OpenSlides functions
     */
    public constructor(
        private router: Router,
        private operator: OperatorService,
        private openSlidesService: OpenSlidesService,
        private fallbackRoutesService: FallbackRoutesService
    ) {}

    /**
     * Checks of the operator has the required permission to see the state.
     *
     * One can set extra data to the state with `data: {basePerm: '<perm>'}` or
     * `data: {basePerm: ['<perm1>', '<perm2>']}` to lock the access to users
     * only with the given permission(s).
     *
     * @param route the route the user wants to navigate to
     */
    public canActivate(route: ActivatedRouteSnapshot): boolean {
        const basePerm: Permission | Permission[] = route.data.basePerm;

        if (!basePerm) {
            return true;
        } else if (basePerm instanceof Array) {
            return this.operator.hasPerms(...basePerm);
        } else {
            return this.operator.hasPerms(basePerm);
        }
    }

    /**
     * Calls {@method canActivate}. Should have the same logic.
     *
     * @param route the route the user wants to navigate to
     */
    public async canActivateChild(route: ActivatedRouteSnapshot): Promise<boolean> {
        await this.operator.loaded;

        if (this.canActivate(route)) {
            return true;
        } else {
            this.handleForbiddenRoute(route);
        }
    }

    /**
     * Handles a forbidden route. If the route is "/" (start page), It is tried to
     * use a fallback route provided by AuthGuardFallbackRoutes. If this won't work
     * or it wasn't the start page in the first place, the operator will be redirected
     * to an error page.
     */
    private handleForbiddenRoute(route: ActivatedRouteSnapshot): void {
        if (route.url.length === 0) {
            // start page
            const fallbackRoute = this.fallbackRoutesService.getFallbackRoute();
            if (fallbackRoute) {
                this.router.navigate([fallbackRoute]);
                return;
            }
        }
        // Fall-through: If the url is the start page, but no other fallback was found,
        // navigate to the error page.

        this.openSlidesService.redirectUrl = location.pathname;
        this.router.navigate(['/error'], {
            queryParams: {
                error: 'Authentication Error',
                msg: route.data.basePerm
            }
        });
    }
}
