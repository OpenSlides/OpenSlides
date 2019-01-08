import { Inject, Component, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material';
import { BaseViewModel } from '../../../../site/base/base-view-model';
import { SortListService } from '../../../../core/services/sort-list.service';

/**
 * A bottom sheet used for setting a list's sorting, used by {@link SortFilterBarComponent}
 * usage:
 * ```
 * @ViewChild('sortBottomSheet')
 * public sortBottomSheet: OsSortBottomSheetComponent<V>;
 * ...
 * this.bottomSheet.open(OsSortBottomSheetComponent, { data: SortService });
 * ```
 */
@Component({
    selector: 'os-sort-bottom-sheet',
    templateUrl: './os-sort-bottom-sheet.component.html',
    styleUrls: ['./os-sort-bottom-sheet.component.scss']
})
export class OsSortBottomSheetComponent<V extends BaseViewModel> implements OnInit {

    /**
     * Constructor. Gets a reference to itself (for closing after interaction)
     * @param data
     * @param sheetRef
     */
    public constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: SortListService<V>, private sheetRef: MatBottomSheetRef ) {
    }

    /**
     * init fucntion. Closes inmediately if no sorting is available.
     */
    public ngOnInit(): void {
        if (!this.data || !this.data.sortOptions || !this.data.sortOptions.options.length){
            throw new Error('No sorting available for a sorting list');
        }
    }

    /**
     * Logic for a toggle of options. Either reverses sorting, or
     * sorts after a new property.
     */
    public clickedOption(item: string): void {
        this.sheetRef.dismiss(item);
    }
}
