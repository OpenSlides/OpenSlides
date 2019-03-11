import { Injectable } from '@angular/core';

import { BaseFilterListService, OsFilter, OsFilterOption } from 'app/core/ui-services/base-filter-list.service';
import { Item, itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ViewItem } from '../models/view-item';
import { StorageService } from 'app/core/core-services/storage.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class AgendaFilterListService extends BaseFilterListService<Item, ViewItem> {
    protected name = 'Agenda';

    public filterOptions: OsFilter[] = [];

    /**
     * Constructor. Also creates the dynamic filter options
     * @param store
     * @param repo
     * @param translate Translation service
     */
    public constructor(store: StorageService, repo: ItemRepositoryService, private translate: TranslateService) {
        super(store, repo);
        this.filterOptions = [
            {
                label: 'Visibility',
                property: 'type',
                options: this.createVisibilityFilterOptions()
            },
            {
                label: 'Status',
                property: 'closed',
                options: [
                    { label: this.translate.instant('Open items'), condition: false },
                    { label: this.translate.instant('Closed items'), condition: true }
                ]
            }
        ];
        this.updateFilterDefinitions(this.filterOptions);
    }

    private createVisibilityFilterOptions(): OsFilterOption[] {
        const options = [];
        itemVisibilityChoices.forEach(choice => {
            options.push({
                condition: choice.key as number,
                label: choice.name
            });
        });
        return options;
    }
}
