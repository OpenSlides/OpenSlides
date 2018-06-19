import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

//it seems that this service is useless
@Injectable({
    providedIn: 'root'
})
export class OpenslidesService {
    constructor(private auth: AuthService, private router: Router) {}

    bootup() {
        // TODO Lock the interface..
        this.auth.init().subscribe(whoami => {
            console.log(whoami);
            if (!whoami.user && !whoami.guest_enabled) {
                this.router.navigate(['/login']);
            } else {
                // It's ok!
            }
        });
    }
}
