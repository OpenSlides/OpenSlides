import { Component, OnInit, HostBinding, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';

import { AuthService } from 'app/core/services/auth.service';
import { AutoupdateService } from 'app/core/services/autoupdate.service';
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
    username = this.operator.username;

    /**
     * Constructor
     *
     * @param authService
     * @param autoupdateService
     * @param operator
     * @param router
     * @param breakpointObserver
     * @param translate
     * @param dialog
     */
    constructor(
        private authService: AuthService,
        private autoupdateService: AutoupdateService,
        private operator: OperatorService,
        private router: Router,
        public vp: ViewportService,
        public translate: TranslateService,
        public dialog: MatDialog
    ) {
        super();
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

        // start autoupdate if the user is logged in:
        this.operator.whoAmI().subscribe(resp => {
            if (resp.user) {
                this.autoupdateService.startAutoupdate();
            } else {
                //if whoami is not sucsessfull, forward to login again
                this.operator.clear();
                this.router.navigate(['/login']);
            }
        });
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

    /**
     * Function to log out the current user
     */
    logOutButton() {
        this.authService.logout().subscribe();
        this.router.navigate(['/login']);
    }
}
