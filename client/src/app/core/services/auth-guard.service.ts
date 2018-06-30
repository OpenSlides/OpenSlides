import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const url: string = state.url;
        return this.checkLogin(url);
    }

    checkLogin(url: string): boolean {
        //check if the user is already logged in.
        //TODO: This is faked
        if (this.authService.isLoggedIn) {
            return true;
        }

        // Store the attempted URL for redirecting
        this.authService.redirectUrl = url;

        // Navigate to the login page with extras
        this.router.navigate(['/login']);
        return false;
    }
}
