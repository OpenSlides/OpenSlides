import { Component, Input, Output, EventEmitter, OnInit, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/scrolling';
import { map } from 'rxjs/operators';

import { ViewportService } from '../../../core/services/viewport.service';
import { MainMenuService } from '../../../core/services/main-menu.service';

/**
 * Reusable head bar component for Apps.
 *
 * Will translate the title automatically.
 *
 * Use `PlusButton=true` and `(plusButtonClicked)=myFunction()` if a plus button is needed
 *
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-head-bar
 *   appName="Files"
 *   plusButton=true
 *   (plusButtonClicked)=onPlusButton()
 *   (ellipsisMenuItem)=onEllipsisItem($event)>
 * </os-head-bar>
 * ```
 */
@Component({
    selector: 'os-head-bar',
    templateUrl: './head-bar.component.html',
    styleUrls: ['./head-bar.component.scss']
})
export class HeadBarComponent implements OnInit {
    /**
     * determine weather the toolbar should be sticky or not
     */
    public stickyToolbar = false;

    /**
     * Determine if the the navigation "hamburger" icon should be displayed in mobile mode
     */
    @Input()
    public nav = true;

    /**
     * Show or hide edit features
     */
    @Input()
    public allowEdit = false;

    /**
     * Custom edit icon if necessary
     */
    @Input()
    public editIcon = 'edit';

    /**
     * Determine edit mode
     */
    @Input()
    public editMode = false;

    /**
     * Determine if there should be a plus button.
     */
    @Input()
    public plusButton = false;

    /**
     * Determine if there should be a back button.
     */
    @Input()
    public backButton = false;

    /**
     * Set to true if the component should use location.back instead
     * of navigating to the parent component
     */
    @Input()
    public goBack = false;

    /**
     * Emit a signal to the parent component if the plus button was clicked
     */
    @Output()
    public plusButtonClicked = new EventEmitter<boolean>();

    /**
     * Sends a signal if a detail view should be edited or editing should be canceled
     */
    @Output()
    public editEvent = new EventEmitter<boolean>();

    /**
     * Sends a signal if a detail view should be saved
     */
    @Output()
    public saveEvent = new EventEmitter<boolean>();

    /**
     * Empty constructor
     */
    public constructor(
        public vp: ViewportService,
        private scrollDispatcher: ScrollDispatcher,
        private ngZone: NgZone,
        private menu: MainMenuService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {}

    /**
     * Emits a signal to the parent if
     */
    public clickPlusButton(): void {
        this.plusButtonClicked.emit(true);
    }

    /**
     * Clicking the burger-menu-icon should toggle the menu
     */
    public clickHamburgerMenu(): void {
        this.menu.toggleMenu();
    }

    /**
     * Toggle edit mode and send a signal to listeners
     */
    public toggleEditMode(): void {
        this.editEvent.next(!this.editMode);
    }

    /**
     * Send a save signal and set edit mode
     */
    public save(): void {
        if (this.editMode) {
            this.saveEvent.next(true);
        }
    }

    /**
     * Exits the view to return to the previous page or
     * visit the parent view again.
     */
    public onBackButton(): void {
        if (this.goBack) {
            this.location.back();
        } else {
            this.router.navigate(['../'], { relativeTo: this.route });
        }
    }

    /**
     * Init function. Subscribe to the scrollDispatcher and decide when to set the top bar to fixed
     *
     * Not working for now.
     */
    public ngOnInit(): void {
        this.scrollDispatcher
            .scrolled()
            .pipe(map((event: CdkScrollable) => this.getScrollPosition(event)))
            .subscribe(scrollTop => {
                this.ngZone.run(() => {
                    if (scrollTop > 60) {
                        this.stickyToolbar = true;
                    } else {
                        this.stickyToolbar = false;
                    }
                });
            });
    }

    /**
     * returns the scroll position
     * @param event
     */
    public getScrollPosition(event: CdkScrollable): number {
        if (event) {
            return event.getElementRef().nativeElement.scrollTop;
        } else {
            return window.scrollY;
        }
    }
}
