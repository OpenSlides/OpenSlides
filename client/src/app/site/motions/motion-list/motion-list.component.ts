import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';

@Component({
    selector: 'app-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.css']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title) {
        super(titleService);
    }

    ngOnInit() {
        super.setTitle('Motions');
    }

    downloadMotionsButton() {
        console.log('Download Motions Button');
    }
}
