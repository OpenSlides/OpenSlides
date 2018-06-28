import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

import { AuthService } from 'app/core/services/auth.service';
import { WebsocketService } from 'app/core/services/websocket.service';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-site',
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.css']
})
export class SiteComponent implements OnInit {
    isMobile = false;

    constructor(
        private authService: AuthService,
        private websocketService: WebsocketService,
        private router: Router,
        private breakpointObserver: BreakpointObserver
    ) {}

    ngOnInit() {
        this.breakpointObserver
            .observe([Breakpoints.Small, Breakpoints.HandsetPortrait])
            .subscribe((state: BreakpointState) => {
                if (state.matches) {
                    this.isMobile = true;
                } else {
                    this.isMobile = false;
                }
            });

        // connect to a the websocket
        const socket = this.websocketService.connect();

        // subscribe to the socket
        socket.subscribe(response => {
            console.log('log : ', response); // will contain all the config variables
        });

        // basically everything needed for AutoUpdate
        socket.next(val => {
            console.log('socket.next: ', val);
        });
    }

    logOutButton() {
        console.log('logout');
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
    }
}
