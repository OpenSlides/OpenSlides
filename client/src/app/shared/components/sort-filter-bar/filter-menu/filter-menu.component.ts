import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';

import { BaseFilterListService, OsFilterOption } from 'app/core/ui-services/base-filter-list.service';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * Component for selecting the filters in a filter menu.
 * It expects to be opened inside a sidenav container,
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 * ```html
 * <os-filter-menu (dismissed)="this.filterMenu.close()">
 * ```
 */
@Component({
    selector: 'os-filter-menu',
    templateUrl: './filter-menu.component.html',
    styleUrls: ['./filter-menu.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class FilterMenuComponent implements OnInit, OnDestroy {
    /**
     * An event emitter to submit a desire to close this component
     * TODO: Might be an easier way to do this
     */
    @Output()
    public dismissed = new EventEmitter<boolean>();

    /**
     * A filterListService for the listView. There are several Services extending
     * the FilterListService; unsure about how to get them in any other way.
     */
    @Input()
    public service: BaseFilterListService<BaseViewModel>;

    /**
     * Constructor. Does nothing.
     * @param service
     */
    public constructor() {}

    /**
     * Directly closes again if no sorting is available
     */
    public ngOnInit(): void {
        if (!this.service.filterDefinitions) {
            this.dismissed.next(true);
        }
    }

    /**
     *
     */
    public ngOnDestroy(): void {
        this.dismissed.unsubscribe();
    }

    /**
     * Tests for escape key (to colose the sidebar)
     * @param event
     */
    public checkKeyEvent(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.dismissed.next(true);
        }
    }

    public isFilter(option: OsFilterOption): boolean {
        return typeof option === 'string' ? false : true;
    }
}
