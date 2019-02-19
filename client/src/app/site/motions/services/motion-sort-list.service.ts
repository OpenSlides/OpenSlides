import { Injectable } from '@angular/core';

import { BaseSortListService, OsSortingDefinition } from 'app/core/ui-services/base-sort-list.service';
import { ViewMotion } from '../models/view-motion';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from 'app/core/core-services/storage.service';
import { ConfigService } from 'app/core/ui-services/config.service';

@Injectable({
    providedIn: 'root'
})
export class MotionSortListService extends BaseSortListService<ViewMotion> {
    public sortOptions: OsSortingDefinition<ViewMotion> = {
        sortProperty: 'callListWeight',
        sortAscending: true,
        options: [
            { property: 'callListWeight', label: 'Call list' },
            { property: 'identifier' },
            { property: 'title' },
            { property: 'submitters' },
            { property: 'category' },
            { property: 'motion_block_id', label: 'Motion block' },
            { property: 'state' },
            { property: 'creationDate', label: this.translate.instant('Creation date') },
            { property: 'lastChangeDate', label: this.translate.instant('Last modified') }
        ]
    };
    protected name = 'Motion';

    /**
     * Constructor. Sets the default sorting if none is set locally
     *
     * @param translate
     * @param store
     * @param config
     */
    public constructor(translate: TranslateService, store: StorageService, config: ConfigService) {
        super(translate, store);
        this.sortOptions.sortProperty = config.instant<keyof ViewMotion>('motions_motions_sorting');
    }
}
