import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';

import { OperatorService } from './operator.service';

/**
 * Classical Auth-Guard. Checks if the user has to correct permissions to enter a page, and forwards to login if not.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
    /**
     * @param operator
     */
    public constructor(private operator: OperatorService) {}

    /**
     * Checks of the operator has the required permission to see the state.
     *
     * One can set extra data to the state with `data: {basePerm: '<perm>'}` or
     * `data: {basePerm: ['<perm1>', '<perm2>']}` to lock the access to users
     * only with the given permission(s).
     *
     * @param route required by `canActivate()`
     * @param state the state (URL) that the user want to access
     */
    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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
     * @param route
     * @param state
     */
    public canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }
}
