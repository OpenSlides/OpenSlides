import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Permission } from '../../../core/services/operator.service';

/**
 * One entry for the ellipsis menu.
 */
export interface EllipsisMenuItem {
    /**
     * The text for the menu entry
     */
    text: string;
    /**
     * An optional icon to display before the text.
     */
    icon?: string;

    /**
     * The action to be performed on click.
     */
    action: string;

    /**
     * An optional permission to see this entry.
     */
    perm?: Permission;
}

/**
 * Reusable head bar component for Apps.
 *
 * Will translate the title automatically.
 *
 * Use `PlusButton=true` and `(plusButtonClicked)=myFunction()` if a plus button is needed
 *
 * Use `[menuLust]=myArray` and `(ellipsisMenuItem)=myFunction($event)` if a menu is needed
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-head-bar
 *   appName="Files"
 *   plusButton=true
 *   [menuList]=myMenu
 *   (plusButtonClicked)=onPlusButton()
 *   (ellipsisMenuItem)=onEllipsisItem($event)>
 * </os-head-bar>
 * ```
 *
 * ### Declaration of a menu provided as `[menuList]=myMenu`:
 *
 * ```ts
 * myMenu = [
 *   {
 *     text: 'Download All',
 *     icon: 'save_alt',
 *     action: 'downloadAllFiles'
 *   },
 * ];
 * ```
 * The parent needs to react to `action` like the following.
 * This will execute a function with the name provided in the
 * `action` field.
 * ```ts
 * onEllipsisItem(item: EllipsisMenuItem) {
 *      if (typeof this[item.action] === 'function') {
 *          this[item.action]();
 *      }
 * }
 * ```
 */
@Component({
    selector: 'os-head-bar',
    templateUrl: './head-bar.component.html',
    styleUrls: ['./head-bar.component.scss']
})
export class HeadBarComponent implements OnInit {
    /**
     * Input declaration for the app name
     */
    @Input()
    public appName: string;

    /**
     * Determine if there should be a plus button.
     */
    @Input()
    public plusButton: false;

    /**
     * If not empty shows a ellipsis menu on the right side
     *
     * The parent needs to provide a menu, i.e `[menuList]=myMenu`.
     */
    @Input()
    public menuList: EllipsisMenuItem[];

    /**
     * Emit a signal to the parent component if the plus button was clicked
     */
    @Output()
    public plusButtonClicked = new EventEmitter<boolean>();

    /**
     * Emit a signal to the parent of an item in the menuList was selected.
     */
    @Output()
    public ellipsisMenuItem = new EventEmitter<EllipsisMenuItem>();

    /**
     * Empty constructor
     */
    public constructor() {}

    /**
     * empty onInit
     */
    public ngOnInit(): void {}

    /**
     * Emits a signal to the parent if an item in the menu was clicked.
     * @param item
     */
    public clickMenu(item: EllipsisMenuItem): void {
        this.ellipsisMenuItem.emit(item);
    }

    /**
     * Emits a signal to the parent if
     */
    public clickPlusButton(): void {
        this.plusButtonClicked.emit(true);
    }
}
