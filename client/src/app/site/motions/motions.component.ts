import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-motions',
    templateUrl: './motions.component.html',
    styleUrls: ['./motions.component.css']
})
export class MotionsComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        super.setTitle('Motions');
    }
}
