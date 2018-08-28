import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from '../../../base.component';

/**
 * Component for the user list view.
 *
 * TODO: Not yet implemented
 */
@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent extends BaseComponent implements OnInit {
    /**
     * The usual constructor for components
     * @param titleService
     * @param translate
     */
    constructor(titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * Init function, sets the title
     */
    ngOnInit() {
        super.setTitle('Users');
    }
}
