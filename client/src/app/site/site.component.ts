import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { MatDialog, MatSidenav } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { AuthService } from '../core/core-services/auth.service';
import { OperatorService } from '../core/core-services/operator.service';
import { BaseComponent } from '../base.component';
import { pageTransition, navItemAnim } from '../shared/animations';
import { ViewportService } from '../core/ui-services/viewport.service';
import { MainMenuService } from '../core/core-services/main-menu.service';
import { OpenSlidesStatusService } from '../core/core-services/openslides-status.service';
import { TimeTravelService } from '../core/core-services/time-travel.service';

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
     * Holds the coordinates where a swipe gesture was used
     */
    private swipeCoord?: [number, number];

    /**
     * Holds the time when the user was swiping
     */
    private swipeTime?: number;

    /**
     * Holds the typed search query.
     */
    public searchform: FormGroup;

    /**
     * Constructor
     *
     * @param authService
     * @param route
     * @param operator
     * @param vp
     * @param translate
     * @param dialog
     * @param mainMenuService
     * @param OSStatus
     * @param timeTravel
     */
    public constructor(
        private authService: AuthService,
        private router: Router,
        public operator: OperatorService,
        public vp: ViewportService,
        public translate: TranslateService,
        public dialog: MatDialog,
        public mainMenuService: MainMenuService,
        public OSStatus: OpenSlidesStatusService,
        public timeTravel: TimeTravelService
    ) {
        super();

        this.operator.getObservable().subscribe(user => {
            if (user) {
                this.username = user.short_name;
            } else {
                this.username = translate.instant('Guest');
            }
            this.isLoggedIn = !!user;
        });

        this.searchform = new FormGroup({ query: new FormControl([]) });
    }

    /**
     * Initialize the site component
     */
    public ngOnInit(): void {
        this.vp.checkForChange();

        // observe the mainMenuService to receive toggle-requests
        this.mainMenuService.toggleMenuSubject.subscribe((value: void) => this.toggleSideNav());

        // get a translation via code: use the translation service
        // this.translate.get('Motions').subscribe((res: string) => {
        //      console.log('translation of motions in the target language: ' + res);
        //  });

        this.router.events.subscribe(event => {
            // Scroll to top if accessing a page, not via browser history stack
            if (event instanceof NavigationEnd) {
                const contentContainer = document.querySelector('.mat-sidenav-content');
                contentContainer.scrollTo(0, 0);
            }
        });
    }

    /**
     * Toggles the side nav
     */
    public toggleSideNav(): void {
        this.sideNav.toggle();
    }

    /**
     * Automatically close the navigation in while navigating in mobile mode
     */
    public mobileAutoCloseNav(): void {
        if (this.vp.isMobile) {
            this.sideNav.close();
        }
    }

    /**
     * Let the user change the language
     * @param lang the desired language (en, de, cs, ...)
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
        } else if (abbreviation === 'cs') {
            return this.translate.instant('Czech');
        }
    }

    /**
     * Function to log out the current user
     */
    public logout(): void {
        this.authService.logout();
    }

    /**
     * Handle swipes and gestures
     */
    public swipe(e: TouchEvent, when: string): void {
        const coord: [number, number] = [e.changedTouches[0].pageX, e.changedTouches[0].pageY];
        const time = new Date().getTime();

        if (when === 'start') {
            this.swipeCoord = coord;
            this.swipeTime = time;
        } else if (when === 'end') {
            const direction = [coord[0] - this.swipeCoord[0], coord[1] - this.swipeCoord[1]];
            const duration = time - this.swipeTime;

            // definition of a "swipe right" gesture to move in the navigation.
            // Required mobile view
            // works anywhere on the screen, but could be limited
            // to the left side of the screen easily if required)
            if (
                duration < 1000 &&
                Math.abs(direction[0]) > 30 && // swipe length to be detected
                Math.abs(direction[0]) > Math.abs(direction[1] * 3) && // 30° should be "horizontal enough"
                direction[0] > 0 // swipe left to right
            ) {
                this.toggleSideNav();
            }
        }
    }

    /**
     * Handler for the search bar
     */
    public search(): void {
        const query = this.searchform.get('query').value;
        this.searchform.reset();
        this.router.navigate(['/search'], { queryParams: { query: query } });
    }
}
