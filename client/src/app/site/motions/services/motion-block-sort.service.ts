import { Injectable } from '@angular/core';

import { BaseSortListService, OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort-list.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewMotionBlock } from '../models/view-motion-block';

@Injectable({
    providedIn: 'root'
})
export class MotionBlockSortService extends BaseSortListService<ViewMotionBlock> {
    public sortOptions: OsSortingOption<ViewMotionBlock>[] = [{ property: 'title' }];

    public constructor(translate: TranslateService, store: StorageService) {
        super('Motion block', translate, store);
    }

    protected async getDefaultDefinition(): Promise<OsSortingDefinition<ViewMotionBlock>> {
        return {
            sortProperty: 'title',
            sortAscending: true
        };
    }
}
