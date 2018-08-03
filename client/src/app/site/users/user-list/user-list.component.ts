import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from '../../../base.component';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent extends BaseComponent implements OnInit {
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    ngOnInit() {
        super.setTitle('Users');
    }
}
