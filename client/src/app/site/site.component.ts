import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'app/core/services/auth.service';
import { OperatorService } from 'app/core/services/operator.service';

import { TranslateService } from '@ngx-translate/core'; //showcase
import { BaseComponent } from 'app/base.component';
import { pageTransition, navItemAnim } from 'app/shared/animations';
import { MatDialog, MatSidenav } from '@angular/material';
import { ViewportService } from '../core/services/viewport.service';

@Component({
    selector: 'app-site',
    animations: [pageTransition, navItemAnim],
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.scss']
})
export class SiteComponent extends BaseComponent implements OnInit {
    /**
     * HTML element of the side panel
     */
    @ViewChild('sideNav') sideNav: MatSidenav;

    /**
     * Get the username from the operator (should be known already)
     */
    public username: string;

    /**
     * is the user logged in, or the anonymous is active.
     */
    public isLoggedIn: boolean;

    /**
     * Constructor
     *
     * @param authService
     * @param operator
     * @param vp
     * @param translate
     * @param dialog
     */
    constructor(
        private authService: AuthService,
        private operator: OperatorService,
        public vp: ViewportService,
        public translate: TranslateService,
        public dialog: MatDialog
    ) {
        super();

        operator.getObservable().subscribe(user => {
            if (user) {
                this.username = user.full_name;
            } else {
                this.username = translate.instant('Guest');
            }
            this.isLoggedIn = !!user;
        });
    }

    /**
     * Initialize the site component
     */
    ngOnInit() {
        this.vp.checkForChange();

        // get a translation via code: use the translation service
        // this.translate.get('Motions').subscribe((res: string) => {
        //      console.log('translation of motions in the target language: ' + res);
        //  });
    }

    /**
     * Closes the sidenav in mobile view
     */
    toggleSideNav() {
        if (this.vp.isMobile) {
            this.sideNav.toggle();
        }
    }

    /**
     * Let the user change the language
     * @param lang the desired language (en, de, fr, ...)
     */
    selectLang(selection: string): void {
        this.translate.use(selection).subscribe();
    }

    /**
     * Get the name of a Language by abbreviation.
     */
    getLangName(abbreviation: string): string {
        if (abbreviation === 'en') {
            return this.translate.instant('English');
        } else if (abbreviation === 'de') {
            return this.translate.instant('German');
        } else if (abbreviation === 'fr') {
            return this.translate.instant('French');
        }
    }

    // TODO: Implement this
    editProfile() {}

    // TODO: Implement this
    changePassword() {}

    /**
     * Function to log out the current user
     */
    logout() {
        this.authService.logout();
    }
}
