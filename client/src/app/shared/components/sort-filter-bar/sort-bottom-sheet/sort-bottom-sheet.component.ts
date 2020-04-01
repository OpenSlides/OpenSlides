import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * A bottom sheet used for setting a list's sorting, used by {@link SortFilterBarComponent}
 * usage:
 * ```
 * @ViewChild('sortBottomSheet')
 * public sortBottomSheet: SortBottomSheetComponent<V>;
 * ...
 * this.bottomSheet.open(SortBottomSheetComponent, { data: SortService });
 * ```
 */
@Component({
    selector: 'os-sort-bottom-sheet',
    templateUrl: './sort-bottom-sheet.component.html',
    styleUrls: ['./sort-bottom-sheet.component.scss']
})
export class SortBottomSheetComponent<V extends BaseViewModel> implements OnInit {
    /**
     * Constructor. Gets a reference to itself (for closing after interaction)
     * @param data
     * @param sheetRef
     */
    public constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: BaseSortListService<V>,
        private sheetRef: MatBottomSheetRef
    ) {}

    /**
     * init function. Closes immediately if no sorting is available.
     */
    public ngOnInit(): void {
        if (!this.data || !this.data.sortOptions || !this.data.sortOptions.length) {
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
