import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';
import { OperatorService } from './operator.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private operator: OperatorService, private router: Router) {}

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
