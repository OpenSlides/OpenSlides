import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';

/**
 * Login component.
 *
 * Serves as container for the login mask, legal notice and privacy policy
 */
@Component({
    selector: 'os-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent extends BaseComponent implements OnInit {
    /**
     * Imports the title service and the translate service
     *
     * @param titleService  to set the title
     * @param translate just needed because super.setTitle depends in the `translator.instant` function
     */
    public constructor(protected titleService: Title, protected translate: TranslateService) {
        super(titleService, translate);
    }

    /**
     * sets the title of the page
     */
    public ngOnInit(): void {
        super.setTitle('Login');
    }
}
