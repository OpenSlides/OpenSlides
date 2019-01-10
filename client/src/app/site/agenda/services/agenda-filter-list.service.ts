import { Injectable } from '@angular/core';

import { FilterListService, OsFilter, OsFilterOption } from '../../../core/services/filter-list.service';
import { Item, itemVisibilityChoices } from '../../../shared/models/agenda/item';
import { ViewItem } from '../models/view-item';
import { StorageService } from 'app/core/services/storage.service';
import { AgendaRepositoryService } from './agenda-repository.service';

@Injectable({
    providedIn: 'root'
})
export class AgendaFilterListService extends FilterListService<Item, ViewItem> {
    protected name = 'Agenda';

    public filterOptions: OsFilter[] = [];

    /**
     * Constructor. Also creates the dynamic filter options
     * @param store
     * @param repo
     */
    public constructor(store: StorageService, repo: AgendaRepositoryService) {
        super(store, repo);
        this.filterOptions = [
            {
                label: 'Visibility',
                property: 'type',
                options: this.createVisibilityFilterOptions()
            },
            {
                label: 'Hidden Status',
                property: 'done',
                options: [{ label: 'Open', condition: false }, { label: 'Closed', condition: true }]
            }
        ];
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
