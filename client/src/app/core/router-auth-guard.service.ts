import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';

import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RouterAuthGuard implements CanActivate {

    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.checkAccess(state.url);
    }

    checkAccess(url: string): boolean {
        if (url === '/login') {
            return true;
        }

        // Check base permission for the current state
        let hasBasePermission = true; // TODO: get this from the current state...

        if (!hasBasePermission) {
            // Store the attempted URL for redirecting
            this.authService.redirectUrl = url;

            // Navigate to the login page with extras
            this.router.navigate(['/login']);
            return false;
        }
        return true;
    }
}
