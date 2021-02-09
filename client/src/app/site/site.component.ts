import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivationEnd, NavigationEnd, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { navItemAnim } from '../shared/animations';
import { OfflineBroadcastService } from 'app/core/core-services/offline-broadcast.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { UpdateService } from 'app/core/ui-services/update.service';
import { ChatNotificationService } from 'app/site/chat/services/chat-notification.service';
import { ChatService } from 'app/site/chat/services/chat.service';
import { BaseComponent } from '../base.component';
import { MainMenuEntry, MainMenuService } from '../core/core-services/main-menu.service';
import { OpenSlidesStatusService } from '../core/core-services/openslides-status.service';
import { OperatorService } from '../core/core-services/operator.service';
import { TimeTravelService } from '../core/core-services/time-travel.service';
import { ViewportService } from '../core/ui-services/viewport.service';

/**
 * Interface to describe possible routing data
 */
interface RoutingData {
    basePerm?: string;
    noInterruption?: boolean;
}

@Component({
    selector: 'os-site',
    animations: [navItemAnim],
    templateUrl: './site.component.html',
    styleUrls: ['./site.component.scss']
})
export class SiteComponent extends BaseComponent implements OnInit {
    /**
     * HTML element of the side panel
     */
    @ViewChild('sideNav', { static: true })
    public sideNav: MatSidenav;

    /**
     * is the user logged in, or the anonymous is active.
     */
    public isLoggedIn: boolean;

    /**
     * Indicates, whether the user is offline or not.
     */
    public isOffline: boolean;

    /**
     * Holds the typed search query.
     */
    public searchform: FormGroup;

    /**
     * Hold the current routing data to make certain checks
     */
    private routingData: RoutingData;

    /**
     * Set to true if an update was suppressed
     */
    private delayedUpdateAvailable = false;

    public get mainMenuEntries(): MainMenuEntry[] {
        return this.mainMenuService.entries;
    }

    public chatNotificationAmount = 0;
    public canSeeChat = false;

    /**
     * Constructor
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
        title: Title,
        protected translate: TranslateService,
        offlineBroadcastService: OfflineBroadcastService,
        private updateService: UpdateService,
        private router: Router,
        public operator: OperatorService,
        public vp: ViewportService,
        public dialog: MatDialog,
        private mainMenuService: MainMenuService,
        public OSStatus: OpenSlidesStatusService,
        public timeTravel: TimeTravelService,
        private matSnackBar: MatSnackBar,
        private overlayService: OverlayService,
        private chatNotificationService: ChatNotificationService,
        private chatService: ChatService
    ) {
        super(title, translate);
        overlayService.showSpinner(translate.instant('Loading data. Please wait ...'));

        offlineBroadcastService.isOfflineObservable.subscribe(offline => {
            this.isOffline = offline;
        });

        this.searchform = new FormGroup({ query: new FormControl([]) });

        // detect routing data such as base perm and noInterruption
        this.router.events
            .pipe(filter(event => event instanceof ActivationEnd && event.snapshot.children.length === 0))
            .subscribe((event: ActivationEnd) => {
                this.routingData = event.snapshot.data as RoutingData;

                // if the current route has no "noInterruption" flag and an update is available, show the update
                if (this.delayedUpdateAvailable && !this.routingData.noInterruption) {
                    this.showUpdateNotification();
                }
            });

        this.chatNotificationService.chatgroupNotificationsObservable.subscribe(amounts => {
            this.chatNotificationAmount = Object.keys(amounts).reduce((sum, key) => sum + amounts[key], 0);
        });
        this.chatService.canSeeChatObservable.subscribe(canSeeChat => (this.canSeeChat = canSeeChat));
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

        // TODO: Remove this, when the ESR version of Firefox >= 64.
        const agent = navigator.userAgent.toLowerCase();
        if (agent.indexOf('firefox') > -1) {
            const index = agent.indexOf('firefox') + 8;
            const version = +agent.slice(index, index + 2);

            if (version < 64) {
                const sideNav = document.querySelector(
                    'mat-sidenav.side-panel > div.mat-drawer-inner-container'
                ) as HTMLElement;
                sideNav.style.overflow = 'hidden';
                sideNav.addEventListener('MozMousePixelScroll', (event: any) => {
                    sideNav.scrollBy(0, event.detail);
                });
            }
        }

        this.router.events.subscribe(event => {
            // Scroll to top if accessing a page, not via browser history stack
            if (event instanceof NavigationEnd) {
                const contentContainer = document.querySelector('.mat-sidenav-content');
                if (contentContainer) {
                    contentContainer.scrollTo(0, 0);
                }
            }
        });

        // check for updates
        this.updateService.updateObservable.subscribe(() => {
            if (this.routingData.noInterruption) {
                this.delayedUpdateAvailable = true;
            } else {
                this.showUpdateNotification();
            }
        });
    }

    /**
     * Shows the update notification
     */
    private showUpdateNotification(): void {
        const ref = this.matSnackBar.open(
            this.translate.instant('A new update is available!'),
            this.translate.instant('Refresh'),
            {
                duration: 0
            }
        );

        // Enforces an update
        ref.onAction().subscribe(() => {
            this.updateService.applyUpdate();
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
            if (
                duration < 1000 &&
                Math.abs(direction[0]) > 30 && // swipe length to be detected
                Math.abs(direction[0]) > Math.abs(direction[1] * 3) // 30° should be "horizontal enough"
            ) {
                // definition of a "swipe right" gesture to move in the navigation
                // only works in the far left edge of the screen
                if (
                    direction[0] > 0 && // swipe left to right
                    this.swipeCoord[0] < 20
                ) {
                    this.sideNav.open();
                }

                // definition of a "swipe left" gesture to remove the navigation
                // should only work in mobile mode to prevent unwanted closing of the nav
                // works anywhere on the screen
                if (
                    direction[0] < 0 && // swipe left to right
                    this.vp.isMobile
                ) {
                    this.sideNav.close();
                }
            }
        }
    }

    /**
     * Function to open the global `super-search.component`.
     *
     * @param event KeyboardEvent to listen to keyboard-inputs.
     */
    @HostListener('document:keydown', ['$event']) public onKeyNavigation(event: KeyboardEvent): void {
        if (event.altKey && event.shiftKey && event.code === 'KeyF') {
            event.preventDefault();
            event.stopPropagation();
            this.overlayService.showSearch();
        }
    }
}
