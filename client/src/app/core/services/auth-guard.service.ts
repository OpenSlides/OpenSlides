import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';
import { OperatorService } from './operator.service';

/**
 * Classical Auth-Guard. Checks if the user has to correct permissions to enter a page, and forwards to login if not.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    /**
     * Initialises the authentication, the operator and the Router
     * @param authService
     * @param operator
     * @param router
     */
    constructor(private authService: AuthService, private operator: OperatorService, private router: Router) {}

    /**
     * Checks of the operator has n id.
     * If so, forward to the desired target.
     *
     * If not, forward to login.
     *
     * TODO: Test if this works for guests and on Projector
     *
     * @param route required by `canActivate()`
     * @param state the state (URL) that the user want to access
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        const url: string = state.url;

        if (this.operator.id) {
            return true;
        } else {
            this.authService.redirectUrl = url;
            this.router.navigate(['/login']);
            return false;
        }
    }
}
