import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BaseComponent } from 'app/base.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-motion-list',
    templateUrl: './motion-list.component.html',
    styleUrls: ['./motion-list.component.css']
})
export class MotionListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Motions');
    }

    downloadMotionsButton() {
        console.log('Download Motions Button');
    }
}
