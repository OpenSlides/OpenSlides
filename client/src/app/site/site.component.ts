import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'app/core/services/auth.service';

@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.css']
})
export class SiteComponent implements OnInit {
    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit() {}

    logOutButton() {
        console.log('logout');
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
    }
}
