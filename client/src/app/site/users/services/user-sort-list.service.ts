import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { BaseSortListService, OsSortingDefinition } from 'app/core/ui-services/base-sort-list.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewUser } from '../models/view-user';

@Injectable({
    providedIn: 'root'
})
export class UserSortListService extends BaseSortListService<ViewUser> {
    public sortOptions: OsSortingDefinition<ViewUser> = {
        sortProperty: 'first_name',
        sortAscending: true,
        options: [
            { property: 'first_name', label: 'Given name' },
            { property: 'last_name', label: 'Surname' },
            { property: 'is_present', label: 'Presence' },
            { property: 'is_active', label: 'Is active' },
            { property: 'is_committee', label: 'Is committee' },
            { property: 'number', label: 'Participant number' },
            { property: 'structure_level', label: 'Structure level' },
            { property: 'comment' }
            // TODO email send?
        ]
    };
    protected name = 'User';

    /**
     * Constructor. Sets the default sorting if none is set locally
     *
     * @param translate
     * @param store
     * @param config
     */
    public constructor(translate: TranslateService, store: StorageService, config: ConfigService) {
        super(translate, store);
        this.defaultSorting = config.instant<keyof ViewUser>('users_sort_by');
    }
}
