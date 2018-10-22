import { Output, Component, OnInit, EventEmitter, Input } from '@angular/core';
import { FilterListService, OsFilterOption } from '../../../../core/services/filter-list.service';

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
    styleUrls: ['./filter-menu.component.scss']
})
export class FilterMenuComponent implements OnInit {

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
    public service: FilterListService<any, any>; // TODO (M, V)

    /**
     * Constructor. Does nothing.
     * @param service
     */
    public constructor() {
    }

    /**
     * Directly closes again if no sorting is available
     */
    public ngOnInit(): void {
        if (!this.service.filterDefinitions) {
            this.dismissed.next(true);
        }
    }

    /**
     * Tests for escape key (to colose the sidebar)
     * @param event
     */
    public checkKeyEvent(event: KeyboardEvent) : void {
        if (event.key === 'Escape'){
            this.dismissed.next(true)
        }
    }
    public isFilter(option: OsFilterOption) : boolean{
        return (typeof option === 'string') ? false : true;
    }
}
