import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MainMenuService } from 'app/core/core-services/main-menu.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { RoutingStateService } from 'app/core/ui-services/routing-state.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';

/**
 * Reusable head bar component for Apps.
 *
 * Will translate the title automatically.
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-head-bar
 *   prevUrl="../.."
 *   saveText="Create"
 *   [nav]="false"
 *   [goBack]="true"
 *   [hasMainButton]="opCanEdit()"
 *   [mainButtonIcon]="edit"
 *   [backButtonIcon]="arrow_back"
 *   [editMode]="editMotion"
 *   [isSaveButtonEnabled]="myConditionIsTrue()"
 *   [multiSelectMode]="isMultiSelect"
 *   (mainEvent)="setEditMode(!editMotion)"
 *   (saveEvent)="saveMotion()">
 *
 *     <!-- Title -->
 *     <div class="title-slot">
 *         My Component Title
 *     </div>
 *
 *     <!-- Menu -->
 *     <div class="menu-slot">
 *         <button type="button" mat-icon-button [matMenuTriggerFor]="myComponentMenu">
 *             <mat-icon>more_vert</mat-icon>
 *         </button>
 *     </div>
 *     <!-- MultiSelect info -->
 *     <div class="central-info-slot">
 *     <button mat-icon-button (click)="toggleMultiSelect()">
 *         <mat-icon>arrow_back</mat-icon>
 *     </button>
 *         <span>{{ selectedRows.length }}&nbsp;</span><span>selected</span>
 * </div>
 * </os-head-bar>
 * ```
 */
@Component({
    selector: 'os-head-bar',
    templateUrl: './head-bar.component.html',
    styleUrls: ['./head-bar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HeadBarComponent implements OnInit {
    /**
     * Determine if the the navigation "hamburger" icon should be displayed in mobile mode
     */
    @Input()
    public nav = true;

    /**
     * Custom icon if necessary
     */
    @Input()
    public mainButtonIcon = 'add_circle';

    /**
     * Custom text to show as "save"
     */
    @Input()
    public saveText = 'Save';

    /**
     * Determine edit mode
     */
    @Input()
    public editMode = false;

    /**
     * Determine, if the search should not be available.
     */
    @Input()
    public isSearchEnabled = true;

    /**
     * The save button can manually be disabled.
     */
    @Input()
    public isSaveButtonEnabled = true;

    /**
     * Determine multiSelect mode: changed interactions and head bar
     */
    @Input()
    public multiSelectMode = false;

    /**
     * Determine if there should be the main action button
     */
    @Input()
    public hasMainButton = false;

    /**
     * Determine if the main action button should be enabled or not.
     */
    @Input()
    public isMainButtonEnabled = true;

    /**
     * Set to true if the component should use location.back instead
     * of navigating to the parent component
     */
    @Input()
    public goBack = false;

    /**
     * Determine the back URL. Default is ".." (previous parent page)
     * Lazy Loaded modules sometimes have different routing events or require
     * special "back" logic.
     * Has only an effect if goBack is set to false
     */
    @Input()
    public prevUrl = '../';

    /**
     * Optional tooltip for the main action
     */
    @Input()
    public mainActionTooltip: string;

    /**
     * Emit a signal to the parent component if the main button was clicked
     */
    @Output()
    public mainEvent = new EventEmitter<void>();

    /**
     * Optional custom event for cancel the edit
     */
    @Output()
    public cancelEditEvent = new EventEmitter<void>();

    /**
     * To detect if the cancel event was used
     */
    public isCancelEditUsed = false;

    /**
     * Sends a signal if a detail view should be saved
     */
    @Output()
    public saveEvent = new EventEmitter<boolean>();

    public get showBackButton(): boolean {
        return !this.nav && !this.multiSelectMode && (this.routingState.isSafePrevUrl || !this.goBack);
    }

    /**
     * Empty constructor
     */
    public constructor(
        public vp: ViewportService,
        private menu: MainMenuService,
        private router: Router,
        private route: ActivatedRoute,
        private routingState: RoutingStateService,
        private overlayService: OverlayService
    ) {}

    /**
     * Detect if the cancel edit event was used
     */
    public ngOnInit(): void {
        this.isCancelEditUsed = this.cancelEditEvent.observers.length > 0;
    }

    /**
     * Emits a signal to the parent if
     */
    public sendMainEvent(): void {
        this.mainEvent.next();
    }

    /**
     * Emits a signal to for custom cancel edits
     */
    public sendCancelEditEvent(): void {
        this.cancelEditEvent.next();
    }

    /**
     * Clicking the burger-menu-icon should toggle the menu
     */
    public clickHamburgerMenu(): void {
        this.menu.toggleMenu();
    }

    /**
     * Send a save signal and set edit mode
     */
    public save(): void {
        this.saveEvent.next(true);
    }

    /**
     * Opens the `super-search.component`.
     */
    public openSearch(): void {
        this.overlayService.showSearch();
    }

    /**
     * Exits the view to return to the previous page or
     * visit the parent view again.
     */
    public onBackButton(): void {
        if (this.goBack) {
            this.routingState.goBack();
        } else if (this.routingState.customOrigin && this.routingState.customOrigin !== this.router.url) {
            this.router.navigate([this.routingState.customOrigin], { relativeTo: this.route });
        } else {
            this.router.navigate([this.prevUrl], { relativeTo: this.route });
        }
    }
}
