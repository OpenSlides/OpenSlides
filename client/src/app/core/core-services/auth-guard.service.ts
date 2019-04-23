import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, CanActivateChild, Router } from '@angular/router';

import { OperatorService } from './operator.service';
import { OpenSlidesService } from './openslides.service';

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
        private openSlidesService: OpenSlidesService
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
        const basePerm: string | string[] = route.data.basePerm;

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
            this.openSlidesService.redirectUrl = location.pathname;
            this.router.navigate(['/error'], {
                queryParams: {
                    error: 'Authentication Error',
                    msg: route.data.basePerm
                }
            });
        }
    }
}
