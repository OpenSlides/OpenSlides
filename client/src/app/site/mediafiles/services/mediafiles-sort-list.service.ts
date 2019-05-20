import { Injectable } from '@angular/core';

import { BaseSortListService, OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewMediafile } from '../models/view-mediafile';

/**
 * Sorting service for the mediafile list
 */
@Injectable({
    providedIn: 'root'
})
export class MediafilesSortListService extends BaseSortListService<ViewMediafile> {
    public sortOptions: OsSortingOption<ViewMediafile>[] = [
        { property: 'title' },
        {
            property: 'type',
            label: this.translate.instant('Type')
        },
        {
            property: 'size',
            label: this.translate.instant('Size')
        }
    ];

    /**
     * Constructor.
     *
     * @param translate required by parent
     * @param store required by parent
     */
    public constructor(translate: TranslateService, store: StorageService) {
        super('Mediafiles', translate, store);
    }

    /**
     * Required by parent
     *
     * @returns the default sorting strategy
     */
    public async getDefaultDefinition(): Promise<OsSortingDefinition<ViewMediafile>> {
        return {
            sortProperty: 'title',
            sortAscending: true
        };
    }
}
