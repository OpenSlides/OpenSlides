import { Injectable } from '@angular/core';

import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewMediafile } from '../models/view-mediafile';

/**
 * Filter service for media files
 */
@Injectable({
    providedIn: 'root'
})
export class MediafileFilterListService extends BaseFilterListService<ViewMediafile> {
    /**
     * Constructor.
     * Sets the filter options according to permissions
     *
     * @param store
     * @param operator
     * @param translate
     */
    public constructor(store: StorageService, private operator: OperatorService, private translate: TranslateService) {
        super('Mediafiles', store);

        this.operator.getUserObservable().subscribe(() => {
            this.setFilterDefinitions();
        });
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter[] {
        const pdfOption: OsFilter = {
            property: 'type',
            label: 'PDF',
            options: [
                {
                    condition: 'application/pdf',
                    label: this.translate.instant('Is PDF file')
                },
                {
                    condition: null,
                    label: this.translate.instant('Is no PDF file')
                }
            ]
        };

        const hiddenOptions: OsFilter = {
            property: 'is_hidden',
            label: this.translate.instant('Visibility'),
            options: [
                { condition: true, label: this.translate.instant('is hidden') },
                { condition: false, label: this.translate.instant('is not hidden') }
            ]
        };

        return this.operator.hasPerms('mediafiles.can_see_hidden') ? [hiddenOptions, pdfOption] : [pdfOption];
    }
}
