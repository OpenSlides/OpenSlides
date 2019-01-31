import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { ViewportService } from '../../../core/ui-services/viewport.service';
import { MainMenuService } from '../../../core/core-services/main-menu.service';

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
 *   [nav]="false"
 *   [goBack]="true"
 *   [mainButton]="opCanEdit()"
 *   [mainButtonIcon]="edit"
 *   [editMode]="editMotion"
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
 *         <span>{{ selectedRows.length }}&nbsp;</span><span translate>selected</span>
 * </div>
 * </os-head-bar>
 * ```
 */
@Component({
    selector: 'os-head-bar',
    templateUrl: './head-bar.component.html',
    styleUrls: ['./head-bar.component.scss']
})
export class HeadBarComponent {
    /**
     * Determine if the the navigation "hamburger" icon should be displayed in mobile mode
     */
    @Input()
    public nav = true;

    /**
     * Custom icon if necessary
     */
    @Input()
    public mainButtonIcon = 'add';

    /**
     * Determine edit mode
     */
    @Input()
    public editMode = false;

    /**
     * Determine multiSelect mode: changed interactions and head bar
     */
    @Input()
    public multiSelectMode = false;

    /**
     * Determine if there should be the main action button
     */
    @Input()
    public mainButton = false;

    /**
     * Set to true if the component should use location.back instead
     * of navigating to the parent component
     */
    @Input()
    public goBack = false;

    /**
     * Emit a signal to the parent component if the main button was clicked
     */
    @Output()
    public mainEvent = new EventEmitter<void>();

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
        private menu: MainMenuService,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) {}

    /**
     * Emits a signal to the parent if
     */
    public sendMainEvent(): void {
        this.mainEvent.next();
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
}
