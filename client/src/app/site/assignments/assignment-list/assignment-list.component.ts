import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../../../base.component';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-assignment-list',
    templateUrl: './assignment-list.component.html',
    styleUrls: ['./assignment-list.component.css']
})
export class AssignmentListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Assignments');
    }

    downloadAssignmentButton(): void {
        console.log('Hello World');
    }
}
