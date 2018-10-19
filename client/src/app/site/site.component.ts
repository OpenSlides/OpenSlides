import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from 'app/core/services/auth.service';
import { OperatorService } from 'app/core/services/operator.service';

import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from 'app/base.component';
import { pageTransition, navItemAnim } from 'app/shared/animations';
import { MatDialog, MatSidenav } from '@angular/material';
import { ViewportService } from '../core/services/viewport.service';
import { MainMenuService } from '../core/services/main-menu.service';

@Component({
    selector: 'os-site',
    animations: [pageTransition, navItemAnim],
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.scss']
})
export class SiteComponent extends BaseComponent implements OnInit {
    /**
     * HTML element of the side panel
     */
    @ViewChild('sideNav')
    public sideNav: MatSidenav;

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
     * @param router
     * @param operator
     * @param vp
     * @param translate
     * @param dialog
     */
    public constructor(
        private authService: AuthService,
        private router: Router,
        public operator: OperatorService,
        public vp: ViewportService,
        public translate: TranslateService,
        public dialog: MatDialog,
        public mainMenuService: MainMenuService // used in the component
    ) {
        super();

        this.operator.getObservable().subscribe(user => {
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
    public ngOnInit(): void {
        this.vp.checkForChange();

        // get a translation via code: use the translation service
        // this.translate.get('Motions').subscribe((res: string) => {
        //      console.log('translation of motions in the target language: ' + res);
        //  });
    }

    /**
     * Closes the sidenav in mobile view
     */
    public toggleSideNav(): void {
        if (this.vp.isMobile) {
            this.sideNav.toggle();
        }
    }

    /**
     * Let the user change the language
     * @param lang the desired language (en, de, fr, ...)
     */
    public selectLang(selection: string): void {
        this.translate.use(selection).subscribe();
    }

    /**
     * Get the name of a Language by abbreviation.
     */
    public getLangName(abbreviation: string): string {
        if (abbreviation === 'en') {
            return this.translate.instant('English');
        } else if (abbreviation === 'de') {
            return this.translate.instant('German');
        } else if (abbreviation === 'fr') {
            return this.translate.instant('French');
        }
    }

    // TODO: Implement this
    public editProfile(): void {
        if (this.operator.user) {
            this.router.navigate([`./users/${this.operator.user.id}`]);
        }
    }

    // TODO: Implement this
    public changePassword(): void {}

    /**
     * Function to log out the current user
     */
    public logout(): void {
        this.authService.logout();
    }

    public navigateToMainPage(): void {
        this.router.navigate(['/']);
    }
}
