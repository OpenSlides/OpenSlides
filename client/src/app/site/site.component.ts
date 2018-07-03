import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

import { AuthService } from 'app/core/services/auth.service';
import { WebsocketService } from 'app/core/services/websocket.service';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core'; //showcase

//into own service
import { DS } from 'app/core/services/DS.service';
import { User } from 'app/core/models/user';
import { Group } from 'app/core/models/group';
import { BaseModel } from '../core/models/baseModel';

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
        private breakpointObserver: BreakpointObserver,
        private translate: TranslateService,
        private dS: DS
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
            this.storeResponse(response);
        });

        // basically everything needed for AutoUpdate
        socket.next(val => {
            console.log('socket.next: ', val);
        });

        //get a translation via code: use the translation service
        this.translate.get('Motions').subscribe((res: string) => {
            console.log(res);
        });
    }

    //test. will move to an own service later
    //create models out of socket answer
    storeResponse(socketResponse): void {
        socketResponse.forEach(model => {
            switch (model.collection) {
                case 'users/group': {
                    this.dS.inject(BaseModel.fromJSON(model.data, Group));
                    break;
                }
                case 'users/user': {
                    this.dS.inject(BaseModel.fromJSON(model.data, User));
                    break;
                }
                default: {
                    console.log('collection: "' + model.collection + '" is not yet parsed');
                    break;
                }
            }
        });
    }

    selectLang(lang: string): void {
        console.log('selected langauge: ', lang);
        console.log('get Langs : ', this.translate.getLangs());

        this.translate.use(lang).subscribe(res => {
            console.log('language changed : ', res);
        });
    }

    logOutButton() {
        console.log('logout');
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
    }
}
