import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, WhoAmIResponse } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class OpenSlidesService {

    constructor(private auth: AuthService, private router: Router) { }

    bootup () {
        // TODO Lock the interface..
        this.auth.init().subscribe((whoami: WhoAmIResponse) => {
            console.log(whoami);
            if (!whoami.user && !whoami.guest_enabled) {
                this.router.navigate(['/login']);
            } else {
                // It's ok!
            }
        });
    }
}
