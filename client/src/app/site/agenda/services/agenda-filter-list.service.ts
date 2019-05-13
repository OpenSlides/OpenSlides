import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { auditTime, map } from 'rxjs/operators';

import { BaseFilterListService, OsFilter, OsFilterOption } from 'app/core/ui-services/base-filter-list.service';
import { itemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ViewItem } from '../models/view-item';
import { StorageService } from 'app/core/core-services/storage.service';
import { ItemRepositoryService } from 'app/core/repositories/agenda/item-repository.service';

@Injectable({
    providedIn: 'root'
})
export class AgendaFilterListService extends BaseFilterListService<ViewItem> {
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

    /**
     * @override from base filter list service: Added custom filtering of items
     * Initializes the filterService. Returns the filtered data as Observable
     */
    public filter(): Observable<ViewItem[]> {
        this.repo
            .getViewModelListObservable()
            .pipe(auditTime(10))
            // Exclude items that are just there to provide a list of speakers. They have many
            // restricted fields and must not be shown in the agenda!
            .pipe(map(itemList => itemList.filter(item => item.type !== undefined)))
            .subscribe(data => {
                this.currentRawData = data;
                this.filteredData = this.filterData(data);
                this.filterDataOutput.next(this.filteredData);
            });
        this.loadStorageDefinition(this.filterDefinitions);
        return this.filterDataOutput;
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
