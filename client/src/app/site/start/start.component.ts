import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css']
})
export class StartComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        super.setTitle('Start page');
    }
}
