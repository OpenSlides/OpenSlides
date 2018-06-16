import { Component, OnInit } from '@angular/core';

import { TitleService } from '../core/title.service';
import {AuthService } from '../core/auth.service';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {

    constructor(private titleService: TitleService, private auth: AuthService) { }

    ngOnInit() {
        this.titleService.setTitle('Start page');
    }

    logout() {
        this.auth.logout();
    }
}
