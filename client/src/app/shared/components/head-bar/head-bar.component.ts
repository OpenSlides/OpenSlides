import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { OperatorService } from '../../../core/services/operator.service';

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
 *     icon: 'download',
 *     action: 'downloadAllFiles'
 *   },
 * ];
 * ```
 * The parent needs to react to `action` like the following.
 * This will execute a function with the name provided in the
 * `action` field.
 * ```ts
 * onEllipsisItem(event: any) {
 *   if (event.action) {
 *     this[event.action]();
 *   }
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
    public menuList: any[];

    /**
     * Emit a signal to the parent component if the plus button was clicked
     */
    @Output()
    public plusButtonClicked = new EventEmitter<boolean>();

    /**
     * Emit a signal to the parent of an item in the menuList was selected.
     */
    @Output()
    public ellipsisMenuItem = new EventEmitter<any>();

    /**
     * Empty constructor
     */
    public constructor(private op: OperatorService) {}

    /**
     * empty onInit
     */
    public ngOnInit(): void {}

    /**
     * Emits a signal to the parent if an item in the menu was clicked.
     * @param item
     */
    public clickMenu(item: any): void {
        this.ellipsisMenuItem.emit(item);
    }

    /**
     * Emits a signal to the parent if
     */
    public clickPlusButton(): void {
        this.plusButtonClicked.emit(true);
    }

    /**
     * Determine if the operator has the correct permission to use a button in the menu
     * @param perm
     */
    public opHasPerm(perm: string): boolean {
        // return false if the operator is not yet loaded
        if (this.op) {
            // if no permission was required, return true
            if (!perm) {
                return true;
            } else {
                return this.op.hasPerms(perm);
            }
        } else {
            return false;
        }
    }
}
